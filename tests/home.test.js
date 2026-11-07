import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyData, prefixed, startSession, editResult, sessionRows, progress, getRow } from '../app/src/domain/session.js'
import { recentPlans, homeWorkout, openWorkoutSession, lastConfirmedAt, finishPartialSession } from '../app/src/domain/home.js'
import { queueSession } from '../app/src/sync/local-groups.js'
import demo from '../examples/scheda-demo.json' with {type:'json'}
function fixture(){
 const data=emptyData(),plan=demo.scheda,w=plan.allenamenti[0]
 data.schede=[{id:plan.id,nome:'Piano A',revisione:1,created_at:'2026-01-01T00:00:00Z'},{id:'p2',nome:'Piano B',revisione:1,created_at:'2026-02-01T00:00:00Z'}]
 data.allenamenti=[{id:w.id,scheda_id:plan.id,nome:w.nome,posizione:1},{id:'w2',scheda_id:plan.id,nome:'Secondo',posizione:2},{id:'other',scheda_id:'p2',nome:'Altro piano',posizione:1}]
 data.esercizi=structuredClone(demo.esercizi)
 data.esercizi_allenamento=w.esercizi.map((e,i)=>({id:e.id,esercizio_id:e.esercizio_id,allenamento_id:w.id,posizione:i+1,...prefixed(e.valori,'corrente')}))
 return data
}
const planId=demo.scheda.id
function start(data){return startSession(data,data.allenamenti[0].id,{now:'2026-10-28T09:00:00Z',zone:'Europe/Rome'})}
test('schede ordinate per ultima esecuzione, mai usate dopo; correzioni storiche non falsano ordine',()=>{
 const data=fixture();assert.equal(recentPlans(data)[0].id,'p2')
 const id=start(data);assert.equal(recentPlans(data)[0].id,planId)
 data.sessioni.push({id:'other-session',allenamento_id:'other',iniziata_at:'2026-10-27T10:00:00Z',terminata_at:'2026-10-27T11:00:00Z'})
 data.esercizi_sessione.push({id:'historical-edit',sessione_id:'other-session',stato:'completato',completato_at:'2026-10-30T12:00:00Z'})
 assert.equal(recentPlans(data)[0].id,planId)
 data.schede[0].deleted_at='oggi';assert.equal(recentPlans(data).length,1)
})
test('prima esecuzione, ripresa ultimo aperto, rotazione dopo chiusura e ritorno al primo',()=>{
 const data=fixture();assert.equal(homeWorkout(data,planId).id,data.allenamenti[0].id)
 const id=start(data);assert.equal(homeWorkout(data,planId).id,data.allenamenti[0].id);assert.equal(openWorkoutSession(data,data.allenamenti[0].id).id,id)
 editResult(data,sessionRows(data,id)[0].id,{}, {confirm:true,now:'2026-10-28T09:10:00Z'})
 finishPartialSession(data,id,'2026-10-30T10:00:00Z');assert.equal(homeWorkout(data,planId).id,'w2');assert.equal(openWorkoutSession(data,data.allenamenti[0].id),null)
 data.sessioni.push({id:'s2',allenamento_id:'w2',iniziata_at:'2026-10-29T08:00:00Z',terminata_at:'2026-10-29T09:00:00Z'})
 assert.equal(homeWorkout(data,planId).id,data.allenamenti[0].id)
})
test('Termina usa l’ultimo confermato in ordine temporale, salta bozze e invia un gruppo atomico',()=>{
 const data=fixture(),id=start(data),rows=sessionRows(data,id)
 editResult(data,rows[0].id,{}, {confirm:true,now:'2026-10-28T09:20:00Z'})
 editResult(data,rows[1].id,{}, {confirm:true,now:'2026-10-28T09:10:00Z'})
 editResult(data,rows[2].id,{serie:5},{now:'2026-10-30T09:00:00Z'})
 assert.equal(lastConfirmedAt(data,id),'2026-10-28T09:20:00Z')
 const session=finishPartialSession(data,id,'2026-10-30T10:00:00Z')
 assert.equal(session.terminata_at,'2026-10-28T09:20:00Z');assert.equal(progress(data,id).percent,40)
 assert.equal(rows[0].stato,'completato');assert.equal(rows[1].stato,'completato')
 for(const row of rows.slice(2)){assert.equal(row.stato,'saltato');assert.equal(row.completato_at,null);assert.equal(row.effettivo_serie,null)}
 const snapshot={data,outbox:[]};queueSession(snapshot,id,'sessione_conclusa',true)
 assert.equal(snapshot.outbox[0].authorized,true);assert.equal(snapshot.outbox[0].records.length,6)
 assert.throws(()=>finishPartialSession(data,id),/già conclusa/)
})
test('nessuna conferma o orari incoerenti: rifiuto senza modificare bozze e sessione',()=>{
 const data=fixture(),id=start(data),before=structuredClone(data)
 assert.equal(lastConfirmedAt(data,id),null);assert.throws(()=>finishPartialSession(data,id),/Conferma almeno/);assert.deepEqual(data,before)
 editResult(data,sessionRows(data,id)[0].id,{}, {confirm:true,now:'2026-10-27T09:00:00Z'})
 const invalid=structuredClone(data);assert.throws(()=>finishPartialSession(data,id),/precede/);assert.deepEqual(data,invalid)
})
test('ripresa di vecchia sessione aperta torna recente, altre schede non cambiano rotazione',()=>{
 const data=fixture(),id=start(data)
 data.sessioni.push({id:'newer',allenamento_id:'w2',iniziata_at:'2026-10-29T08:00:00Z',terminata_at:'2026-10-29T09:00:00Z'})
 assert.equal(homeWorkout(data,planId).id,data.allenamenti[0].id)
 editResult(data,sessionRows(data,id)[0].id,{}, {confirm:true,now:'2026-10-30T09:00:00Z'})
 assert.equal(homeWorkout(data,planId).id,getRow(data,'sessioni',id).allenamento_id)
})
