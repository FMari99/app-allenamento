import test from 'node:test'
import assert from 'node:assert/strict'
import { validateValues } from '../app/src/domain/categories.js'
test('bozze parziali e risultati confermabili', () => {
  assert.equal(validateValues('ripetizioni_carico', { serie: 3 }, { partial: true }), true)
  assert.throws(() => validateValues('ripetizioni_carico', { serie: 3 }))
  assert.equal(validateValues('ripetizioni_carico', { serie: 3, ripetizioni: 8, carico_kg: 0 }), true)
})
test('rifiuta misure incoerenti, frazioni, valori non finiti', () => {
  for (const values of [{serie:1.5,ripetizioni:8},{serie:3,ripetizioni:0},{serie:3,ripetizioni:Infinity},{serie:3,ripetizioni:8,durata_secondi:30}]) {
    assert.throws(() => validateValues('ripetizioni', values))
  }
})
