import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyData } from '../app/src/domain/session.js'
import { ensureExtraDemoPlan } from '../app/src/data/local/extra-demo-plan.js'
test('seconda scheda demo: riusa catalogo e conserva righe esistenti, senza duplicarsi al riavvio',()=>{
 const data=emptyData();data.schede=[{id:'original',nome:'Originale'}];data.esercizi=[{id:'exercise'}];data.esercizi_allenamento=[{id:'source',esercizio_id:'exercise',allenamento_id:'old-workout',corrente_serie:3,ai_serie:3}];data.sessioni=[{id:'ongoing',terminata_at:null}]
 const before=structuredClone(data)
 assert.equal(ensureExtraDemoPlan(data),true);assert.equal(data.schede.length,2);assert.deepEqual(data.schede[0],before.schede[0]);assert.deepEqual(data.sessioni,before.sessioni);assert.deepEqual(data.esercizi,before.esercizi)
 const extra=data.allenamenti[0];assert.equal(extra.scheda_id,data.schede[1].id);assert.equal(data.esercizi_allenamento[1].allenamento_id,extra.id);assert.equal(data.esercizi_allenamento[1].corrente_serie,3)
 const once=structuredClone(data);assert.equal(ensureExtraDemoPlan(data),false);assert.deepEqual(data,once)
})
test('archivio demo ancora vuoto resta vuoto fino al caricamento esplicito',()=>{const data=emptyData();assert.equal(ensureExtraDemoPlan(data),false);assert.deepEqual(data,emptyData())})
