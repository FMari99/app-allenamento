import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyData } from '../app/src/domain/session.js'
import { writeTool, removeTool, setToolAvailable, exerciseEquipment } from '../app/src/domain/equipment.js'
import { nextSendableGroup } from '../app/src/sync/contract.js'
import { freeze, acknowledge } from '../app/src/sync/engine.js'
const fixture=()=>({data:emptyData(),outbox:[]})
test('ricreare con nuovo ID un nome appena rimosso attende la cancellazione in cloud',()=>{
 const s=fixture();writeTool(s,null,{nome:'Panca'})
 removeTool(s,s.data.strumenti[0].id);const first=s.outbox[0];freeze(first)
 writeTool(s,null,{nome:'Panca'})
 assert.deepEqual(s.outbox[1].depends_on,[first.operation_id])
 first.status='conflict';assert.equal(nextSendableGroup(s),undefined)
})
test('strumento nuovo con note vuote, disponibilità e invio automatico nello stesso gruppo',()=>{
 const s=fixture();writeTool(s,null,{nome:' Manubri '})
 const tool=s.data.strumenti[0]
 assert.equal(tool.nome,'Manubri');assert.equal(tool.note,'');assert.equal(s.data.attrezzatura_disponibile[0].strumento_id,tool.id)
 assert.equal(s.outbox.length,1);assert.equal(s.outbox[0].records.length,2);assert.equal(nextSendableGroup(s),s.outbox[0])
 assert.throws(()=>writeTool(s,null,{nome:' MANUBRI '}),/già/);assert.throws(()=>writeTool(s,null,{nome:' '}),/nome/)
})
test('note libere e rinomina non cambiano schede o risultati; nessun invio per valori invariati',()=>{
 const s=fixture();writeTool(s,null,{nome:'Sbarra'});const tool=s.data.strumenti[0]
 s.outbox=[];const plans=structuredClone([s.data.schede,s.data.sessioni,s.data.esercizi_sessione])
 writeTool(s,tool.id,{note:'Al parco\nSolo al mattino'});writeTool(s,tool.id,{nome:'Sbarra del parco'})
 assert.equal(tool.note,'Al parco\nSolo al mattino');assert.equal(s.outbox.length,1)
 const op=s.outbox[0].operation_id;assert.equal(writeTool(s,tool.id,{note:tool.note}),0);assert.equal(s.outbox[0].operation_id,op)
 assert.deepEqual([s.data.schede,s.data.sessioni,s.data.esercizi_sessione],plans)
})
test('togliere disponibilità conserva associazioni; eliminare nasconde lo strumento e disattiva i legami',()=>{
 const s=fixture();writeTool(s,null,{nome:'Manubri'});const tool=s.data.strumenti[0]
 s.data.esercizi_strumenti=[{id:'a',esercizio_id:'e',strumento_id:tool.id,ruolo:'necessario'}]
 setToolAvailable(s,tool.id,false)
 assert.equal(exerciseEquipment(s.data,'e').length,1);assert.equal(exerciseEquipment(s.data,'e')[0].available,false)
 assert.equal(s.data.esercizi_strumenti[0].deleted_at,undefined)
 setToolAvailable(s,tool.id,true);removeTool(s,tool.id)
 assert.equal(exerciseEquipment(s.data,'e').length,0);assert.ok(s.data.esercizi_strumenti[0].deleted_at);assert.ok(s.data.attrezzatura_disponibile[0].deleted_at)
 assert.throws(()=>writeTool(s,tool.id,{note:'x'}),/disponibile/)
 writeTool(s,null,{nome:'Manubri'});assert.notEqual(s.data.strumenti[1].id,tool.id)
})
test('modifica e rimozione dopo invio tentato conservano payload e dipendenze',()=>{
 const s=fixture();writeTool(s,null,{nome:'Panca'});const tool=s.data.strumenti[0],first=s.outbox[0]
 freeze(first);const payload=structuredClone(first.payload)
 writeTool(s,tool.id,{note:'Pieghevole'});removeTool(s,tool.id)
 assert.deepEqual(first.payload,payload);assert.equal(s.outbox.length,2);assert.deepEqual(s.outbox[1].depends_on,[first.operation_id])
 acknowledge(s,first.operation_id,first.records.map(r=>({tabella:r.table,riga:{...r.data,row_version:1}})))
 assert.ok(s.data.strumenti[0].deleted_at);assert.equal(s.outbox[0].records[0].data.row_version,1);assert.equal(nextSendableGroup(s),s.outbox[0])
})
