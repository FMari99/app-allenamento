import test from 'node:test'
import assert from 'node:assert/strict'
import { reactive,computed,watch,nextTick } from 'vue'
import { shareUnchanged } from '../app/src/state/snapshot.js'
import { nextSendableGroup } from '../app/src/sync/contract.js'
const fixture=()=>({data:{esercizi:[{id:'e',nome:'Esercizio'}],esercizi_sessione:[{id:'r',stato:'da_eseguire'}]},ui:{page:'workout',position:0},local:{sets:{}},outbox:[],sync:{}})
test('commit sync/metadati conserva riferimenti usati da form, attrezzatura, calendario e grafici',async()=>{
 const state=reactive({snapshot:fixture()}),data=computed(()=>state.snapshot.data),points=computed(()=>data.value.esercizi_sessione.map(r=>({...r})))
 const original=state.snapshot,originalData=data.value,originalPoints=points.value
 let resets=0;const stop=watch(points,()=>resets++)
 const draft=JSON.parse(JSON.stringify(original));draft.sync.lastUpload='oggi';draft.local.notifiedRestId='timer'
 state.snapshot=shareUnchanged(state.snapshot,draft);await nextTick()
 assert.equal(state.snapshot.data,originalData);assert.equal(points.value,originalPoints);assert.equal(resets,0);assert.equal(state.snapshot.ui,original.ui);stop()
})
test('un cambiamento reale aggiorna soltanto il ramo interessato, mantenendo lo snapshot precedente intatto',()=>{
 const previous=fixture(),draft=structuredClone(previous);draft.data.esercizi_sessione[0].stato='completato'
 const next=shareUnchanged(previous,draft)
 assert.notEqual(next.data,previous.data);assert.notEqual(next.data.esercizi_sessione,previous.data.esercizi_sessione)
 assert.equal(next.data.esercizi,previous.data.esercizi);assert.equal(next.ui,previous.ui);assert.equal(previous.data.esercizi_sessione[0].stato,'da_eseguire')
 assert.equal(shareUnchanged(next,structuredClone(next)),next)
 const removed=structuredClone(next);delete removed.local;assert.equal(Object.hasOwn(shareUnchanged(next,removed),'local'),false)
})
test('retry periodico senza gruppi inviabili è inattivo; dipendenze e gruppi manuali restano esclusi',()=>{
 const s=fixture();assert.equal(nextSendableGroup(s),undefined)
 const manual={operation_id:'manual',kind:'piano_modificato',authorized:false,status:'pending',depends_on:[]};s.outbox.push(manual)
 assert.equal(nextSendableGroup(s),undefined)
 const auto={operation_id:'auto',kind:'sessione_conclusa',authorized:true,status:'pending',depends_on:['manual']};s.outbox.push(auto)
 assert.equal(nextSendableGroup(s),undefined);assert.equal(nextSendableGroup(s,true),manual)
 s.outbox.shift();assert.equal(nextSendableGroup(s),auto);assert.equal(nextSendableGroup(s,false,new Set(['auto'])),undefined)
 auto.status='conflict';assert.equal(nextSendableGroup(s),undefined)
})
test('cursore del grafico mantiene l’identità della selezione anche quando arrivano ACK o nuovi punti',async()=>{
 const {keepPointSelection}=await import('../app/src/domain/consultation.js')
 const previous=[{id:'a'},{id:'b'}],updated=[{id:'a',row_version:2},{id:'b'},{id:'c'}]
 assert.equal(keepPointSelection(updated,previous,0),0);assert.equal(keepPointSelection(updated,previous,1),1)
 assert.equal(keepPointSelection([{id:'b'},{id:'c'}],previous,0),1);assert.equal(keepPointSelection([],previous,1),0)
})
