import test from 'node:test'
import assert from 'node:assert/strict'
import demo from '../examples/scheda-demo.json' with {type:'json'}
import { emptyData,prefixed,startSession,sessionRows,progress } from '../app/src/domain/session.js'
import { advanceExercise,elapsedClock,previousResultsPage } from '../app/src/domain/execution.js'
import { reviewDraft, reviewChanged, saveSessionReview } from '../app/src/domain/session-review.js'
function fixture(){
 const data=emptyData(),p=demo.scheda,w=p.allenamenti[0]
 data.schede=[{id:p.id,nome:'Demo',revisione:1}];data.allenamenti=[{id:w.id,nome:w.nome,scheda_id:p.id}];data.esercizi=structuredClone(demo.esercizi)
 data.esercizi_allenamento=w.esercizi.map((e,i)=>({id:e.id,esercizio_id:e.esercizio_id,allenamento_id:w.id,posizione:i+1,...prefixed(e.valori,'corrente')}))
 const id=startSession(data,w.id,{now:'2026-10-30T10:00:00Z',zone:'Europe/Rome'})
 return {data,outbox:[],ui:{page:'workout',sessionId:id,position:0}}
}
const at='2026-10-30T10:10:00Z'
test('Completato valida e avanza nello stesso snapshot, senza concludere prematuramente',()=>{
 const s=fixture(),row=sessionRows(s.data,s.ui.sessionId)[0]
 const outcome=advanceExercise(s,row.id,{ripetizioni:12},{now:at})
 assert.equal(outcome.finished,false);assert.equal(row.stato,'completato');assert.equal(row.effettivo_ripetizioni,12);assert.equal(s.ui.position,1);assert.equal(s.data.sessioni[0].terminata_at,null);assert.equal(s.outbox[0].authorized,false)
 assert.throws(()=>advanceExercise(s,row.id,{}, {now:at}),/cambiato/)
})
test('Salta azzera i valori e avanza senza contare l’esercizio eseguito',()=>{
 const s=fixture(),row=sessionRows(s.data,s.ui.sessionId)[0]
 advanceExercise(s,row.id,{}, {skip:true,now:at})
 assert.equal(row.stato,'saltato');assert.equal(row.effettivo_serie,null);assert.equal(row.completato_at,null);assert.equal(s.ui.position,1);assert.equal(progress(s.data,s.ui.sessionId).percent,0)
})
test('anteprima futura bloccata; ultimo esercizio conclude solo dopo avanzamento sequenziale',()=>{
 const s=fixture(),rows=sessionRows(s.data,s.ui.sessionId);s.ui.position=rows.length-1
 assert.throws(()=>advanceExercise(s,rows.at(-1).id,{}, {now:at}),/non è ancora iniziato/)
 s.ui.position=0
 for(const row of rows.slice(0,-1))advanceExercise(s,row.id,{}, {skip:true,now:at})
 const result=advanceExercise(s,rows.at(-1).id,{}, {now:at})
 assert.equal(result.finished,true);assert.equal(s.data.sessioni[0].terminata_at,at);assert.equal(s.ui.page,'home');assert.equal(s.outbox[0].authorized,true);assert.equal(s.outbox[0].records.length,6);assert.ok(rows.slice(0,-1).every(r=>r.stato==='saltato'))
})
test('anche Salta sull’ultimo termina; una sessione tutta saltata non produce risultati fittizi',()=>{
 const s=fixture(),rows=sessionRows(s.data,s.ui.sessionId)
 for(const row of rows)advanceExercise(s,row.id,{}, {skip:true,now:at})
 assert.equal(s.ui.page,'home');assert.equal(s.data.sessioni[0].terminata_at,at);assert.equal(progress(s.data,s.ui.sessionId).percent,0);assert.equal(s.outbox.length,1);assert.equal(s.outbox[0].authorized,true)
})
test('input non valido non cambia dati, posizione o coda',()=>{
 const s=fixture(),before=structuredClone(s)
 assert.throws(()=>advanceExercise(s,s.data.esercizi_sessione[0].id,{serie:null},{now:at}),/mancanti/);assert.deepEqual(s,before)
})
test('correzione storica salva tutta la sessione mantenendo stati, orari e invio manuale',()=>{
 const s=fixture(),rows=sessionRows(s.data,s.ui.sessionId)
 for(const row of rows)advanceExercise(s,row.id,{}, {now:at})
 s.outbox=[];Object.assign(s.ui,{page:'workout',position:rows.length-1})
 const draft=reviewDraft(s.data,s.ui.sessionId),before=structuredClone(s)
 assert.equal(reviewChanged(s.data,s.ui.sessionId,draft),false)
 for(const values of Object.values(draft)){const key=Object.keys(values).find(key=>values[key]!=null);values[key]++}
 assert.equal(reviewChanged(s.data,s.ui.sessionId,draft),true)
 assert.deepEqual(s,before)
 assert.equal(saveSessionReview(s,s.ui.sessionId,draft,'2026-11-09T12:00:00Z'),rows.length)
 assert.equal(s.data.sessioni[0].terminata_at,at);assert.equal(s.outbox.length,1);assert.equal(s.outbox[0].authorized,false);assert.equal(s.outbox[0].kind,'correzione_risultati')
 assert.ok(rows.every((row,i)=>row.stato==='completato' && row.completato_at===before.data.esercizi_sessione[i].completato_at))
 assert.equal(reviewChanged(s.data,s.ui.sessionId,draft),false)
 assert.throws(()=>advanceExercise(s,rows.at(-1).id,{}),/non è ancora iniziato/)
 assert.equal(saveSessionReview(s,s.ui.sessionId,draft),0);assert.equal(s.outbox.length,1)
})
test('salvataggio storico invalido non modifica nulla; saltati e payload tentati restano intatti',()=>{
 const s=fixture(),rows=sessionRows(s.data,s.ui.sessionId)
 advanceExercise(s,rows[0].id,{}, {skip:true,now:at})
 for(const row of rows.slice(1))advanceExercise(s,row.id,{}, {now:at})
 const draft=reviewDraft(s.data,s.ui.sessionId)
 assert.equal(draft[rows[0].id],undefined)
 const before=structuredClone(s)
 draft[rows[1].id].serie++;draft[rows.at(-1).id].durata_secondi=null
 assert.throws(()=>saveSessionReview(s,s.ui.sessionId,draft),/mancanti/);assert.deepEqual(s,before)
 draft[rows.at(-1).id].durata_secondi=1200
 s.outbox[0].payload={frozen:true};const attempted=structuredClone(s.outbox[0])
 saveSessionReview(s,s.ui.sessionId,draft)
 assert.deepEqual(s.outbox[0],attempted);assert.deepEqual(s.outbox[1].depends_on,[attempted.operation_id])
 assert.equal(rows[0].stato,'saltato');assert.equal(rows[0].effettivo_serie,null)
})
test('cronometro include ore/giorni e si ferma alla fine; precedenti paginati cinque per volta',()=>{
 const session={iniziata_at:'2026-10-29T10:00:00Z',terminata_at:null}
 assert.equal(elapsedClock(session,Date.parse('2026-10-30T11:02:03Z')),'25:02:03')
 session.terminata_at='2026-10-29T10:01:04Z';assert.equal(elapsedClock(session,Date.now()),'00:01:04')
 const points=Array.from({length:12},(_,i)=>({id:i}));assert.deepEqual(previousResultsPage(points,1).rows.map(p=>p.id),[5,6,7,8,9]);assert.equal(previousResultsPage(points,9).page,2);assert.equal(previousResultsPage(points,2).rows.length,2)
})
test('Riprendi trova il primo esercizio ancora da fare e conserva lo storico in revisione',async()=>{
 const {resumePosition}=await import('../app/src/domain/execution.js')
 const s=fixture(),rows=sessionRows(s.data,s.ui.sessionId)
 advanceExercise(s,rows[0].id,{}, {skip:true,now:at});advanceExercise(s,rows[1].id,{}, {now:at})
 assert.equal(resumePosition(s.data,s.ui.sessionId),2)
 for(const row of rows.slice(2))advanceExercise(s,row.id,{}, {skip:true,now:at})
 assert.equal(resumePosition(s.data,s.ui.sessionId),0)
})
