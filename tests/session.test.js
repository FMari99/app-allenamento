import test from 'node:test'
import assert from 'node:assert/strict'
import demo from '../examples/scheda-demo.json' with { type: 'json' }
import { emptyData, prefixed, startSession, sessionRows, measures, editResult, confirmedHistory, progress, finishSession, suggestedWorkout, sessionStatus, updateCurrent, setInventory, exerciseForResult, formatDuration } from '../app/src/domain/session.js'
import { enqueue, queueSession } from '../app/src/sync/local-groups.js'
import { canRetryAutomatically } from '../app/src/sync/contract.js'
function fixture() {
  const data = emptyData()
  const plan = demo.scheda
  data.schede = [{ id: plan.id, nome: plan.nome, revisione: 1 }]
  data.esercizi = structuredClone(demo.esercizi)
  const first = plan.allenamenti[0]
  data.allenamenti = [{ id: first.id, scheda_id: plan.id, nome: first.nome, posizione: 1 }, { id: 'second-workout', scheda_id: plan.id, nome: 'Secondo', posizione: 2 }]
  data.esercizi_allenamento = first.esercizi.map((entry, i) => ({ id: entry.id, esercizio_id: entry.esercizio_id, allenamento_id: first.id, posizione: i + 1, ...prefixed(entry.valori, 'ai'), ...prefixed(entry.valori, 'corrente') }))
  return data
}
const start = data => startSession(data, data.allenamenti[0].id, { now: '2026-10-29T10:00:00Z', zone: 'Europe/Rome' })
test('le cinque categorie partono come bozze senza duplicare catalogo o valori previsti', () => {
  const data = fixture(), id = start(data)
  const rows = sessionRows(data, id)
  assert.equal(rows.length, 5)
  for (const row of rows) {
    const { entry, exercise } = exerciseForResult(data, row)
    assert.deepEqual(measures(row, 'effettivo'), measures(entry, 'corrente'))
    assert.equal(confirmedHistory(data, exercise.id).length, 0)
    assert.equal('esercizio_id' in row, false)
    assert.equal(Object.keys(row).some(key => key.startsWith('previsto_')), false)
  }
  assert.equal(progress(data, id).percent, 0)
  assert.throws(() => finishSession(data, id), /mancanti/)
  assert.equal(suggestedWorkout(data, demo.scheda.id).id, data.allenamenti[0].id)
})
test('conferma, correzione, campi parziali e saltato non producono progressi fittizi', () => {
  const data = fixture(), id = start(data), row = sessionRows(data, id)[0]
  editResult(data, row.id, {}, { confirm: true })
  assert.equal(progress(data, id).percent, 20)
  editResult(data, row.id, { ripetizioni: null })
  assert.equal(row.stato, 'da_eseguire')
  assert.equal(confirmedHistory(data, data.esercizi[0].id).length, 0)
  assert.throws(() => editResult(data, row.id, {}, { confirm: true }), /mancanti/)
  editResult(data, row.id, {}, { skip: true })
  assert.ok(Object.values(measures(row, 'effettivo')).every(value => value === null))
  assert.equal(progress(data, id).percent, 0)
  assert.throws(() => editResult(data, row.id, { serie: -2 }), /non valido/)
})
test('chiusura, durata e rotazione usano solo sessioni concluse anche dopo scelta manuale', () => {
  const data = fixture(), id = start(data)
  const rows = sessionRows(data, id)
  rows.forEach((row, i) => editResult(data, row.id, {}, i === 4 ? { skip: true } : { confirm: true }))
  finishSession(data, id, '2026-10-29T10:45:00Z')
  assert.equal(progress(data, id).percent, 80)
  assert.equal(formatDuration(data.sessioni[0]), '45 min')
  assert.equal(suggestedWorkout(data, demo.scheda.id).id, 'second-workout')
  data.sessioni.push({ ...data.sessioni[0], id: 'manual', allenamento_id: 'second-workout', terminata_at: '2026-10-29T12:00:00Z' })
  assert.equal(suggestedWorkout(data, demo.scheda.id).id, data.allenamenti[0].id)
})
test('mezzanotte nel fuso della sessione non inventa una fine e permette la ripresa', () => {
  const data = fixture(), id = start(data), session = data.sessioni[0]
  assert.equal(sessionStatus(session, '2026-10-29T22:59:00Z'), 'in corso')
  assert.equal(sessionStatus(session, '2026-10-29T23:00:00Z'), 'incompleta')
  assert.equal(formatDuration(session, '2026-10-30T10:00:00Z'), 'Nessuna durata finale')
  sessionRows(data, id).forEach(row => editResult(data, row.id, {}, { confirm: true }))
  finishSession(data, id, '2026-10-30T10:00:00Z')
  assert.equal(formatDuration(session), '24 h 0 min')
})
test('modificare il piano conserva proposta AI e valori già precompilati', () => {
  const data = fixture(), id = start(data), row = sessionRows(data, id)[0]
  const entry = data.esercizi_allenamento[0]
  updateCurrent(data, entry.id, { serie: 4, ripetizioni: 12 })
  assert.equal(entry.ai_serie, 3)
  assert.equal(entry.corrente_serie, 4)
  assert.equal(row.effettivo_serie, 3)
  assert.equal(data.schede[0].revisione, 2)
})
test('lo storico risolve la vecchia voce disattivata dopo una sostituzione', () => {
  const data = fixture(), id = start(data), row = sessionRows(data, id)[0]
  editResult(data, row.id, {}, { confirm: true })
  const old = data.esercizi_allenamento[0]
  old.deleted_at = '2026-10-29T11:00:00Z'
  data.esercizi_allenamento.push({ ...old, id: 'replacement', esercizio_id: data.esercizi[2].id, deleted_at: null })
  assert.equal(exerciseForResult(data, row).entry.id, old.id)
  assert.equal(confirmedHistory(data, data.esercizi[0].id).length, 1)
})
test('inventario ripetuto riusa la stessa riga e conserva la disattivazione', () => {
  const data = fixture()
  data.strumenti.push({ id: 'tool', nome: 'Manubrio' })
  setInventory(data, ['tool'])
  const id = data.attrezzatura_disponibile[0].id
  setInventory(data, [])
  assert.ok(data.attrezzatura_disponibile[0].deleted_at)
  setInventory(data, ['tool'])
  assert.equal(data.attrezzatura_disponibile.length, 1)
  assert.equal(data.attrezzatura_disponibile[0].id, id)
  assert.equal(data.attrezzatura_disponibile[0].deleted_at, null)
})
test('gruppo concluso automatico separato da piano e correzioni manuali', () => {
  const data = fixture(), id = start(data), snapshot = { data, outbox: [] }
  const row = sessionRows(data, id)[0]
  queueSession(snapshot, id, 'sessione_conclusa', true)
  const automatic = structuredClone(snapshot.outbox[0])
  enqueue(snapshot, 'plan', 'piano_modificato', false, [{ table: 'schede', data: data.schede[0] }])
  editResult(data, row.id, { ripetizioni: 20 }, { confirm: true })
  const correction = queueSession(snapshot, id, 'correzione_risultati', false)
  assert.deepEqual(snapshot.outbox[0], automatic)
  assert.equal(snapshot.outbox.filter(canRetryAutomatically).length, 1)
  assert.deepEqual(correction.depends_on, [automatic.operation_id])
  assert.equal(snapshot.outbox.length, 3)
})
