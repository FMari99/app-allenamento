import test from 'node:test'
import assert from 'node:assert/strict'
import { canRetryAutomatically } from '../app/src/sync/contract.js'
test('un retry automatico non trascina modifiche manuali o conflitti', () => {
  assert.equal(canRetryAutomatically({kind:'sessione_conclusa',authorized:true,status:'pending'}),true)
  for (const group of [
    {kind:'modifica_video',authorized:true,status:'pending'},
    {kind:'sessione_conclusa',authorized:false,status:'pending'},
    {kind:'sessione_conclusa',authorized:true,status:'conflict'},
  ]) assert.equal(canRetryAutomatically(group),false)
})
