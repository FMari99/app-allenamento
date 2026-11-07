import test from 'node:test'
import assert from 'node:assert/strict'
import { recordSet,undoSet,dismissRest,setCount,restRemaining,afterExercise,changeRest } from '../app/src/domain/rest.js'
function fixture(){return {outbox:[],data:{sessioni:[{id:'s'}],esercizi:[{id:'e',categoria:'ripetizioni'}],schede:[{id:'p',revisione:1}],allenamenti:[{id:'w',scheda_id:'p'}],esercizi_allenamento:[{id:'a',esercizio_id:'e',allenamento_id:'w',corrente_serie:3,corrente_ripetizioni:8,ai_recupero_serie_secondi:10,ai_recupero_esercizio_secondi:20,corrente_recupero_serie_secondi:10,corrente_recupero_esercizio_secondi:20}],esercizi_sessione:[{id:'r',sessione_id:'s',esercizio_allenamento_id:'a',posizione:1,effettivo_serie:3},{id:'next',sessione_id:'s',esercizio_allenamento_id:'a',posizione:2,effettivo_serie:3}]}}}
test('serie locali: recupero intermedio, annullamento e recupero finale che prosegue al prossimo esercizio',()=>{
 const s=fixture();recordSet(s,'r',1000);assert.equal(setCount(s,'r'),1);assert.equal(s.local.rest.kind,'serie');assert.equal(restRemaining(s.local.rest,5000),6)
 assert.throws(()=>recordSet(s,'r',2000),/Attendi/);undoSet(s,'r');assert.equal(setCount(s,'r'),0);assert.equal(s.local.rest,null)
 for(let i=0;i<3;i++){recordSet(s,'r',20000+i*20000);if(i<2)dismissRest(s,'s')}
 assert.equal(s.local.rest.kind,'esercizio');const end=s.local.rest.endsAt;afterExercise(s,'r',{now:70000});assert.equal(s.local.rest.endsAt,end)
 const reopened=structuredClone(s);assert.equal(setCount(reopened,'r'),3);assert.equal(restRemaining(reopened.local.rest,90000),0);assert.deepEqual(s.outbox,[]);assert.equal('count' in s.data.esercizi_sessione[0],false)
})
test('ultimo esercizio senza recupero finale; skip dell’esercizio destinatario ferma il recupero',()=>{
 const s=fixture();s.data.esercizi_sessione[1].effettivo_serie=1;recordSet(s,'next',1000);assert.equal(s.local.rest,null)
 s.local.rest={sessionId:'s',sourceId:'r',targetId:'next',endsAt:100000};afterExercise(s,'next',{skip:true});assert.equal(s.local.rest,null)
})
test('modifica recuperi preserva originale AI e timer partito; durate negative rifiutate',()=>{
 const s=fixture();recordSet(s,'r',1000);const end=s.local.rest.endsAt
 changeRest(s.data,'a',{recupero_serie_secondi:60,recupero_esercizio_secondi:90});assert.equal(s.data.esercizi_allenamento[0].ai_recupero_serie_secondi,10);assert.equal(s.data.esercizi_allenamento[0].corrente_recupero_serie_secondi,60);assert.equal(s.data.schede[0].revisione,2);assert.equal(s.local.rest.endsAt,end)
 assert.throws(()=>changeRest(s.data,'a',{recupero_serie_secondi:-1,recupero_esercizio_secondi:0}),/non negativi/)
})
test('correzioni di sessioni chiuse non avviano recuperi',()=>{
 const s=fixture();s.data.sessioni[0].terminata_at='2026-11-01T10:00:00Z';afterExercise(s,'r',{now:1000});assert.equal(s.local?.rest,undefined)
})
test('riprendere dopo il recupero finale non lo riavvia su Completato; Annulla serie lo rende ripetibile',()=>{
 const s=fixture()
 for(let i=0;i<3;i++){recordSet(s,'r',1000+i*20000);if(i<2)dismissRest(s,'s')}
 dismissRest(s,'s');afterExercise(s,'r',{now:100000});assert.equal(s.local.rest,null)
 undoSet(s,'r');recordSet(s,'r',110000);assert.equal(s.local.rest.kind,'esercizio')
})
