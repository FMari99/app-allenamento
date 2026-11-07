import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyData,prefixed,startSession,sessionRows } from '../app/src/domain/session.js'
import { startTimer,completeSet,continueTimer,restartTimer,tickTimer,timerNext } from '../app/src/domain/training-timer.js'
import { proposeFuture,pendingFuture,resolveFuture } from '../app/src/domain/future.js'
const fixture=(sets=2)=>{
 const data=emptyData();data.schede=[{id:'p',nome:'P',revisione:1}];data.allenamenti=[{id:'w',scheda_id:'p',nome:'W'}];data.esercizi=[{id:'e',nome:'Plank',categoria:'durata'}]
 data.esercizi_allenamento=[1,2].map(i=>({id:'a'+i,allenamento_id:'w',esercizio_id:'e',posizione:i,...prefixed({serie:sets,durata_secondi:10},'corrente'),corrente_recupero_serie_secondi:5,corrente_recupero_esercizio_secondi:7}))
 const id=startSession(data,'w',{now:new Date(1000).toISOString(),zone:'UTC'}),s={data,outbox:[],ui:{sessionId:id,position:0,page:'workout'},local:{settings:{autoSequence:true,preparationSeconds:3}}}
 return s
}
const rows=s=>sessionRows(s.data,s.ui.sessionId)
test('sequenza preparazione/lavoro/recupero, ultima serie conferma e passa al prossimo una volta sola',()=>{
 const s=fixture(),id=rows(s)[0].id;startTimer(s,id,1000);assert.equal(s.local.rest.kind,'prepare')
 tickTimer(s,s.local.rest.id,4000);assert.equal(s.local.rest.kind,'work');assert.equal(s.local.rest.endsAt,14000)
 tickTimer(s,s.local.rest.id,14000);assert.equal(s.local.sets[id].count,1);assert.equal(s.local.rest.kind,'serie');assert.match(timerNext(s),/Prossima serie: 2 di 2/)
 tickTimer(s,s.local.rest.id,19000);assert.equal(s.local.rest.kind,'prepare');tickTimer(s,s.local.rest.id,22000);tickTimer(s,s.local.rest.id,32000)
 assert.equal(rows(s)[0].stato,'completato');assert.equal(s.ui.position,1);assert.equal(s.local.rest.kind,'esercizio');assert.match(timerNext(s),/Prossimo esercizio: Plank/)
 const p=s.local.rest.id;tickTimer(s,p,39000);assert.equal(s.local.rest.id,p);continueTimer(s,40000);assert.equal(s.local.rest,null)
 assert.throws(()=>completeSet(s,id,41000),/già concluso/)
})
test('riavvio non conta serie, timer scaduto dopo sospensione non inventa risultati; conferma manuale esplicita',()=>{
 const s=fixture(),id=rows(s)[0].id;startTimer(s,id,1000);continueTimer(s,2000);assert.equal(s.local.rest.kind,'work')
 restartTimer(s,3000);assert.equal(s.local.rest.kind,'prepare');assert.equal(s.local.rest.endsAt,6000)
 tickTimer(s,s.local.rest.id,6000);const expired=s.local.rest.id;tickTimer(s,expired,99999)
 assert.equal(s.local.rest.id,expired);assert.equal(s.local.sets?.[id],undefined);continueTimer(s,100000);assert.equal(s.local.sets[id].count,1)
})
test('interrompere lavoro non conferma; zero recupero auto continua; ultima serie finale chiude gruppo automatico',()=>{
 const s=fixture(1),id=rows(s)[0].id;startTimer(s,id,1000);continueTimer(s,1000);continueTimer(s,2000);assert.equal(s.local.rest,null);assert.equal(rows(s)[0].stato,'da_eseguire')
 completeSet(s,id,3000);assert.equal(s.ui.position,1);continueTimer(s,10000)
 const last=rows(s)[1].id;const result=completeSet(s,last,11000);assert.equal(result.finished,true);assert.equal(s.ui.page,'home');assert.equal(s.local.rest,null);assert.equal(s.outbox[0].authorized,true)
 const z=fixture();z.data.esercizi_allenamento[0].corrente_recupero_serie_secondi=0;completeSet(z,rows(z)[0].id,2000);assert.equal(z.local.rest.kind,'prepare')
})
test('proposta futura non cambia sessione origine; rimanda, poi applica senza confermare risultati o modificare AI',()=>{
 const s=fixture(),id=rows(s)[0].id,entry=s.data.esercizi_allenamento[0];entry.ai_serie=2;const before=rows(s)[0].effettivo_serie
 proposeFuture(s,id,{serie:3,durata_secondi:15});assert.equal(pendingFuture(s,id),null);assert.equal(rows(s)[0].effettivo_serie,before)
 const proposal=structuredClone(entry.proposta_futura);entry.proposta_futura.sessione_origine_id='old'
 assert.ok(pendingFuture(s,id));resolveFuture(s,id,'later');assert.equal(pendingFuture(s,id),null)
 entry.proposta_futura={...proposal,sessione_origine_id:'old',rinviata_sessione_id:null};s.local.futureSeen={}
 resolveFuture(s,id,'apply');assert.equal(entry.corrente_serie,3);assert.equal(entry.ai_serie,2);assert.equal(rows(s)[0].effettivo_serie,3);assert.equal(rows(s)[0].stato,'da_eseguire');assert.equal(entry.proposta_futura,null);assert.equal(s.outbox[0].authorized,false);assert.equal(s.data.schede[0].revisione,2)
})
test('promemoria e annullamento, proposte congelate immutabili e successore dipendente',()=>{
 const s=fixture(),id=rows(s)[0].id;proposeFuture(s,id);const original=s.outbox[0];original.payload={operation_id:original.operation_id,modifiche:[]};const before=structuredClone(original)
 proposeFuture(s,id,{serie:4,durata_secondi:10});assert.deepEqual(s.outbox[0],before);assert.equal(s.outbox.length,2);assert.ok(s.outbox[1].depends_on.includes(original.operation_id));assert.equal(s.data.schede[0].revisione,3)
 s.data.esercizi_allenamento[0].proposta_futura.sessione_origine_id='old';resolveFuture(s,id,'cancel');assert.equal(s.data.esercizi_allenamento[0].proposta_futura,null);assert.equal(rows(s)[0].effettivo_serie,2)
})
test('timer riavviato o scaduto senza automatismo non duplica le serie; annullamento pulisce il lavoro',async()=>{
 const {cancelSession}=await import('../app/src/domain/execution.js')
 const s=fixture(),id=rows(s)[0].id;s.local.settings.autoSequence=false;startTimer(s,id,1000);continueTimer(s,4000)
 const timer=s.local.rest.id;tickTimer(s,timer,14000);assert.equal(s.local.sets?.[id],undefined)
 continueTimer(s,15000);assert.equal(s.local.sets[id].count,1);const end=s.local.rest.endsAt
 restartTimer(s,17000);assert.equal(s.local.sets[id].count,1);assert.ok(s.local.rest.endsAt>end)
 cancelSession(s,s.ui.sessionId);assert.equal(s.local.rest,null);assert.equal(s.ui.page,'home')
})
test('proposta rinviata resta rinviata dopo riapertura; valori di categorie estranee rifiutati',()=>{
 const s=fixture(),id=rows(s)[0].id;assert.throws(()=>proposeFuture(s,id,{serie:2,ripetizioni:10}),/non valido/)
 proposeFuture(s,id);s.data.esercizi_allenamento[0].proposta_futura.sessione_origine_id='previous'
 resolveFuture(s,id,'later');const reloaded=structuredClone(s);delete reloaded.local.futureSeen
 assert.equal(pendingFuture(reloaded,id),null)
 reloaded.data.esercizi_allenamento[0].proposta_futura.rinviata_sessione_id='previous';assert.ok(pendingFuture(reloaded,id))
})

test('prossimo esercizio mostra attrezzatura attiva e carico della sessione, senza inventare pesi',()=>{
 const s=fixture(1),[first,next]=rows(s)
 s.data.strumenti=[{id:'d',nome:'Manubri'},{id:'removed',nome:'Panca',deleted_at:'2026-01-01'}]
 s.data.esercizi_strumenti=[{esercizio_id:'e',strumento_id:'d'},{esercizio_id:'e',strumento_id:'d'},{esercizio_id:'e',strumento_id:'removed'},{esercizio_id:'e',strumento_id:'missing'},{esercizio_id:'e',strumento_id:'other',deleted_at:'2026-01-01'}]
 s.local.rest={sourceId:first.id,targetId:next.id,kind:'esercizio'}
 next.effettivo_carico_kg=8.5
 assert.equal(timerNext(s),'Prossimo esercizio: Plank (Manubri · carico 8,5 kg)')
 next.effettivo_carico_kg=0;assert.equal(timerNext(s),'Prossimo esercizio: Plank (Manubri)')
 s.data.esercizi_strumenti=[];assert.equal(timerNext(s),'Prossimo esercizio: Plank')
 next.effettivo_carico_kg=8;assert.equal(timerNext(s),'Prossimo esercizio: Plank (carico 8 kg)')
})
