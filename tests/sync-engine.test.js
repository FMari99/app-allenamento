import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyData } from '../app/src/domain/session.js'
import { enqueue } from '../app/src/sync/local-groups.js'
import { createSyncEngine, freeze, acknowledge, mergeDownload, resolveConflict } from '../app/src/sync/engine.js'
const fixture = () => ({ data: { ...emptyData(), sessioni: [{ id: 's1', row_version: 0, nome: 'inizio' }] }, outbox: [] })
const row = s => ({ table: 'sessioni', data: s.data.sessioni[0] })
const receipt = payload => payload.modifiche.map(m => ({ tabella: m.tabella, riga: { ...m.dati, row_version: m.versione_attesa + 1, user_id: 'owner', updated_at: 'server', created_at: 'server' } }))
function harness(snapshot, remote) {
  return createSyncEngine({ read: () => snapshot, commit: async change => { const next = structuredClone(snapshot); change(next); Object.assign(snapshot, next) }, remote: { download: async () => emptyData(), row: async () => null, ...remote } })
}
test('risposta persa: stesso payload persistito dopo riavvio, invio manuale estraneo escluso', async () => {
  const s = fixture()
  enqueue(s, 'auto', 'sessione_conclusa', true, [row(s)])
  enqueue(s, 'manual', 'piano_modificato', false, [{ table: 'strumenti', data: { id: 'tool', nome: 'A' } }])
  let sent
  await assert.rejects(harness(s, { send: async payload => { sent = payload; throw new Error('rete persa dopo commit') } })(false), /rete persa/)
  const restarted = structuredClone(s)
  await harness(restarted, { send: async payload => { assert.deepEqual(payload, sent); return receipt(payload) } })(false)
  assert.equal(restarted.outbox.length, 1)
  assert.equal(restarted.outbox[0].id, 'manual')
  assert.equal(restarted.data.sessioni[0].row_version, 1)
})
test('modifica durante invio: snapshot congelato intatto, ACK mantiene correzione e aggiorna versione', async () => {
  const s = fixture()
  const first = enqueue(s, 'session', 'sessione_conclusa', true, [row(s)])
  let count = 0
  await harness(s, { send: async payload => {
    count++
    assert.equal(payload.modifiche[0].dati.nome, 'inizio')
    s.data.sessioni[0].nome = 'corretto'
    const correction = enqueue(s, 'session', 'correzione_risultati', false, [row(s)])
    assert.deepEqual(correction.depends_on, [first.operation_id])
    return receipt(payload)
  } })(false)
  assert.equal(count, 1)
  assert.equal(s.data.sessioni[0].nome, 'corretto')
  assert.equal(s.outbox[0].records[0].data.row_version, 1)
  await harness(s, { send: async payload => { assert.equal(payload.modifiche[0].versione_attesa, 1); return receipt(payload) } })(true)
  assert.equal(s.outbox.length, 0)
  assert.equal(s.data.sessioni[0].row_version, 2)
})
test('conflitto isola gruppo, preserva due copie, download non sovrascrive modifiche', async () => {
  const s = fixture()
  enqueue(s, 'conflict', 'sessione_conclusa', true, [row(s)])
  enqueue(s, 'independent', 'inventario_confermato', true, [{ table: 'strumenti', data: { id: 'tool', nome: 'A' } }])
  const online = { id: 's1', nome: 'remoto', row_version: 3 }
  await harness(s, { send: async payload => { if (payload.modifiche[0].dati.id === 's1') throw Object.assign(new Error('conflitto'), { code: '40001' }); return receipt(payload) }, row: async () => online })(false)
  assert.equal(s.outbox.length, 1)
  assert.equal(s.outbox[0].status, 'conflict')
  mergeDownload(s, { ...emptyData(), sessioni: [online, { id: 'indipendente', row_version: 1 }] })
  assert.equal(s.data.sessioni[0].nome, 'inizio')
  assert.equal(s.data.sessioni.length, 2)
  const old = s.outbox[0].operation_id
  resolveConflict(s, old, 'local')
  assert.notEqual(s.outbox[0].operation_id, old)
  assert.equal(s.outbox[0].authorized, false)
  assert.equal(s.outbox[0].records[0].data.row_version, 3)
  let sent = false
  await harness(s, { send: async () => { sent = true } })(false)
  assert.equal(sent, false)
  await harness(s, { send: async p => receipt(p) })(true)
  assert.equal(s.outbox.length, 0)
  assert.equal(s.data.sessioni[0].row_version, 4)
})
test('risoluzione remota e ricevuta non valida non cancellano dati prima della scelta', () => {
  const s = fixture(), group = enqueue(s, 'g', 'sessione_conclusa', true, [row(s)])
  freeze(group)
  assert.throws(() => acknowledge(s, group.operation_id, []), /incompleta/)
  assert.equal(s.outbox.length, 1)
  group.conflict = [{ table: 'sessioni', id: 's1', local: structuredClone(group.records[0].data), remote: { id: 's1', nome: 'online', row_version: 2 } }]
  resolveConflict(s, group.operation_id, 'remote')
  assert.equal(s.data.sessioni[0].nome, 'online')
  assert.equal(s.outbox.length, 0)
})
test('dipendenze preservate a modifica gruppo non congelato, errori auth lasciano coda', async () => {
  const s = fixture()
  const first = enqueue(s, 'g', 'sessione_conclusa', true, [row(s)])
  const next = enqueue(s, 'correction', 'correzione_risultati', false, [row(s)])
  freeze(first)
  await assert.rejects(harness(s, { send: async () => { throw Object.assign(new Error('accesso scaduto'), { status: 401, code: 'PGRST301' }) } })(false), /accesso scaduto/)
  assert.equal(s.outbox.length, 2)
  assert.deepEqual(s.outbox.find(g => g.id === next.id).depends_on, [first.operation_id])
})
test('commit locale fallito impedisce richiesta remota', async () => {
  const s = fixture(); enqueue(s, 'g', 'sessione_conclusa', true, [row(s)])
  let calls = 0
  const engine = createSyncEngine({ read: () => s, commit: async () => { throw new Error('quota') }, remote: { send: async () => calls++ } })
  await assert.rejects(engine(false), /quota/)
  assert.equal(calls, 0)
})
test('controllo versioni prima del primo invio evita RPC in conflitto e normalizza revisione piano', async () => {
  const s = fixture()
  enqueue(s, 'g', 'sessione_conclusa', true, [row(s)])
  let calls = 0
  await harness(s, { inspect: async records => records.map(r => ({ table: r.table, id: r.data.id, local: r.data, remote: { ...r.data, row_version: 2 } })), send: async () => calls++ })(false)
  assert.equal(calls, 0)
  assert.equal(s.outbox[0].status, 'conflict')
  assert.equal(s.outbox[0].payload, undefined)
})
test('scelta locale include correzione dipendente senza perdere i nuovi valori', () => {
  const s = fixture(), first = enqueue(s, 'g', 'sessione_conclusa', true, [row(s)])
  freeze(first)
  s.data.sessioni[0].nome = 'ultima correzione'
  enqueue(s, 'correction', 'correzione_risultati', false, [row(s)])
  first.conflict = [{ table: 'sessioni', id: 's1', local: first.records[0].data, remote: { id: 's1', nome: 'online', row_version: 3 } }]
  resolveConflict(s, first.operation_id, 'local')
  assert.equal(s.outbox.length, 1)
  assert.equal(s.outbox[0].records[0].data.nome, 'ultima correzione')
  assert.equal(s.outbox[0].records[0].data.row_version, 3)
  assert.deepEqual(s.outbox[0].depends_on, [])
})
