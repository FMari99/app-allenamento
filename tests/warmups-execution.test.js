import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyData,prefixed,startSession,sessionRows,editResult } from '../app/src/domain/session.js'
import { advanceExercise,cancelSession,canExecute,rememberStarted,currentExerciseIndex } from '../app/src/domain/execution.js'
import { seedDemoWarmups } from '../app/src/data/local/demo-warmups.js'
import { enqueue,queueSession } from '../app/src/sync/local-groups.js'
import { freeze,createSyncEngine } from '../app/src/sync/engine.js'
import { canRetryAutomatically } from '../app/src/sync/contract.js'
import { recordSet } from '../app/src/domain/rest.js'
import { shouldAnnounceRest } from '../app/src/platform/timer-sound.js'
function fixture(){
 const data=emptyData();data.schede=[{id:'p',nome:'Prova',revisione:1}];data.esercizi=[{id:'e',categoria:'ripetizioni'}]
 data.allenamenti=[{id:'warm',tipo:'riscaldamento',scheda_id:'p',posizione:4},{id:'other',tipo:'riscaldamento',scheda_id:'p',posizione:5},...['a','b','c'].map((id,i)=>({id,scheda_id:'p',posizione:i+1,riscaldamento_id:i<2 ? 'warm' : 'other'}))]
 data.esercizi_allenamento=['warm','other','a','b','c'].map(id=>({id:'entry-'+id,allenamento_id:id,esercizio_id:'e',posizione:1,...prefixed({serie:2,ripetizioni:5},'corrente')}))
 return {data,outbox:[],ui:{page:'workout',position:0}}
}
function begin(s,id='a'){s.ui.sessionId=startSession(s.data,id,{now:'2026-11-02T10:00:00Z',zone:'Europe/Rome'});return sessionRows(s.data,s.ui.sessionId)}
test('blocchi condivisi o specifici: voci non duplicate, risultati distinti per sessione e ordine continuo',()=>{
 const s=fixture(),a=begin(s);assert.deepEqual(a.map(r=>r.esercizio_allenamento_id),['entry-warm','entry-a']);assert.deepEqual(a.map(r=>r.posizione),[1,2])
 for(const r of a)advanceExercise(s,r.id,{}, {skip:true})
 s.ui.position=0;const b=begin(s,'b');assert.equal(b[0].esercizio_allenamento_id,a[0].esercizio_allenamento_id);assert.notEqual(b[0].id,a[0].id)
 for(const r of b)advanceExercise(s,r.id,{}, {skip:true})
 s.ui.position=0;assert.equal(begin(s,'c')[0].esercizio_allenamento_id,'entry-other')
 assert.throws(()=>startSession(fixture().data,'warm'),/non disponibile/)
})
test('anteprima non sblocca futuro; revisione precedente e riapertura conservano gli esercizi iniziati',()=>{
 const s=fixture(),rows=begin(s);s.ui.position=1
 assert.equal(canExecute(s,rows[1].id),false);assert.throws(()=>recordSet(s,rows[1].id),/non è ancora iniziato/)
 assert.throws(()=>advanceExercise(s,rows[1].id,{}),/non è ancora iniziato/)
 s.ui.position=0;advanceExercise(s,rows[0].id,{});assert.equal(canExecute(s,rows[1].id),true)
 rememberStarted(s,s.ui.sessionId);editResult(s.data,rows[0].id,{ripetizioni:6})
 assert.equal(currentExerciseIndex(structuredClone(s),s.ui.sessionId),1)
})
test('annullamento atomico toglie risultati e timer senza cancellare la scheda o autorizzare altri gruppi',()=>{
 const s=fixture(),rows=begin(s);recordSet(s,rows[0].id);queueSession(s,s.ui.sessionId,'sessione_in_corso',false)
 enqueue(s,'video:e','video_modificato',false,[{table:'esercizi',data:s.data.esercizi[0]}])
 cancelSession(s,s.ui.sessionId)
 assert.equal(s.ui.page,'home');assert.equal(s.data.sessioni[0].deleted_at!==null,true);assert.equal(sessionRows(s.data,s.data.sessioni[0].id).length,0);assert.equal(s.local.rest,null);assert.equal(Object.keys(s.local.sets).length,0)
 assert.equal(s.outbox.find(g=>g.logical_id==='video:e').authorized,false)
 const cancellation=s.outbox.find(g=>g.kind==='sessione_annullata');assert.equal(canRetryAutomatically(cancellation),true);assert.equal(cancellation.records.length,3);assert.ok(cancellation.records.every(r=>r.data.deleted_at))
 assert.throws(()=>editResult(s.data,rows[0].id,{}),/non disponibile/)
 assert.ok(startSession(s.data,'a'))
})
test('annullamento dopo risposta persa conserva payload tentato e invia poi tutte le tombstone',async()=>{
 const s=fixture(),rows=begin(s);queueSession(s,s.ui.sessionId,'sessione_in_corso',false)
 const original=s.outbox[0];freeze(original);const payload=structuredClone(original.payload)
 cancelSession(s,s.ui.sessionId)
 assert.deepEqual(original.payload,payload);assert.equal(s.outbox.length,2);assert.ok(s.outbox[1].depends_on.includes(original.operation_id))
 let version=0;const sent=[]
 const engine=createSyncEngine({read:()=>s,commit:async f=>f(s),remote:{send:async p=>{sent.push(p);version++;return p.modifiche.map(m=>({tabella:m.tabella,riga:{...m.dati,row_version:version}}))}}})
 await engine(false);assert.equal(sent.length,2);assert.deepEqual(sent[0],payload);assert.ok(sent[1].modifiche.every(m=>m.dati.deleted_at));assert.ok(sent[1].modifiche.every(m=>m.versione_attesa===1));assert.equal(s.outbox.length,0);assert.equal(s.data.esercizi_sessione.filter(r=>!r.deleted_at).length,0)
})
test('suono solo su transizione a fine timer, nessun replay a riapertura, in background o se disattivato',()=>{
 const rest={id:'r',endsAt:10000},previous={id:'r',remaining:1}
 assert.equal(shouldAnnounceRest(previous,rest,10100,true,true,null),true)
 for(const args of [[null,rest,10100,true,true,null],[previous,rest,10100,false,true,null],[previous,rest,10100,true,false,null],[previous,rest,15000,true,true,null],[previous,rest,10100,true,true,'r']])assert.equal(shouldAnnounceRest(...args),false)
})
test('upgrade demo riscaldamenti idempotente senza alterare sessioni esistenti',()=>{
 const s=fixture();s.data.allenamenti=s.data.allenamenti.filter(w=>!w.tipo);const old=structuredClone(s.data.sessioni)
 assert.equal(seedDemoWarmups(s.data),true);assert.equal(seedDemoWarmups(s.data),false);assert.deepEqual(s.data.sessioni,old)
})
