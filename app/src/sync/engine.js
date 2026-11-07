import { tables } from '../domain/session.js'
import { nextSendableGroup } from './contract.js'
import { recordKey } from './local-groups.js'
const clone = value => JSON.parse(JSON.stringify(value))
const technical = new Set(['user_id', 'created_at', 'updated_at', 'row_version'])
export const business = row => Object.fromEntries(Object.entries(row).filter(([key]) => !technical.has(key)))
export function freeze(group) {
  if (group.payload) return
  group.payload = { operation_id: group.operation_id, modifiche: group.records.map(record => ({
    tabella: record.table, versione_attesa: record.data.row_version ?? 0, dati: business(record.data),
  })) }
}
export function acknowledge(snapshot, operationId, receipt) {
  const group = snapshot.outbox.find(item => item.operation_id === operationId)
  if (!group?.payload || !Array.isArray(receipt) || receipt.length !== group.records.length) throw new Error('Ricevuta incompleta: conservato il gruppo in attesa')
  const received = new Map(receipt.map(item => [`${item.tabella}:${item.riga.id}`, item.riga]))
  for (const record of group.records) if (!received.has(recordKey(record))) throw new Error('Ricevuta non corrispondente al gruppo')
  snapshot.outbox = snapshot.outbox.filter(item => item.operation_id !== operationId)
  for (const record of group.records) {
    const row = received.get(recordKey(record))
    const pending = snapshot.outbox.flatMap(item => item.records).filter(item => recordKey(item) === recordKey(record))
    for (const item of pending) {
      if (snapshot.outbox.some(g => g.payload && g.records.includes(item))) throw new Error('Dipendenza già inviata: ricevuta non applicabile')
      Object.assign(item.data, { row_version: row.row_version, created_at: row.created_at, updated_at: row.updated_at, user_id: row.user_id })
      if (record.table === 'schede') item.data.revisione = row.revisione + 1
    }
    const index = snapshot.data[record.table].findIndex(item => item.id === row.id)
    const current = pending.at(-1)?.data ?? row
    if (index < 0) snapshot.data[record.table].push(clone(current))
    else snapshot.data[record.table][index] = clone(current)
  }
  for (const item of snapshot.outbox) item.depends_on = (item.depends_on ?? []).filter(op => op !== operationId)
  snapshot.sync = { ...snapshot.sync, lastUpload: new Date().toISOString() }
}
export function mergeDownload(snapshot, remote) {
  const protectedKeys = new Set(snapshot.outbox.flatMap(group => group.records.map(recordKey)))
  for (const table of tables) {
    const rows = new Map(snapshot.data[table].map(row => [row.id, row]))
    for (const row of remote[table]) if (!protectedKeys.has(`${table}:${row.id}`)) rows.set(row.id, row)
    snapshot.data[table] = [...rows.values()]
  }
  snapshot.sync = { ...snapshot.sync, lastDownload: new Date().toISOString() }
}
// Solo il gruppo con conflitto si ferma. Le copie sono persistite insieme alla coda.
export function resolveConflict(snapshot, operationId, choice) {
  const group = snapshot.outbox.find(g => g.operation_id === operationId)
  if (!group?.conflict || !['local', 'remote'].includes(choice)) throw new Error('Conflitto non disponibile')
  const blocked = new Set([operationId])
  let changed = true
  while (changed) {
    changed = false
    for (const item of snapshot.outbox) if (!blocked.has(item.operation_id) && item.depends_on?.some(op => blocked.has(op))) { blocked.add(item.operation_id); changed = true }
  }
  const linked = snapshot.outbox.filter(item => blocked.has(item.operation_id))
  if (linked.some(item => item !== group && item.payload)) throw new Error('Prima ritenta l’invio già avviato delle modifiche collegate.')
  if (choice === 'remote') {
    for (const record of group.conflict) {
      const rows = snapshot.data[record.table]
      const index = rows.findIndex(row => row.id === record.id)
      if (record.remote) { if (index < 0) rows.push(clone(record.remote)); else rows[index] = clone(record.remote) }
      else if (index >= 0) rows.splice(index, 1)
    }
    // Le copie successive restano nell’esportazione fino alla scelta esplicita.
    snapshot.outbox = snapshot.outbox.filter(item => !blocked.has(item.operation_id))
    for (const item of linked) for (const record of item.records) {
      if (group.conflict.some(c => c.table === record.table && c.id === record.data.id)) continue
      throw new Error('Il gruppo collegato contiene altri elementi: esporta prima e richiedi assistenza.')
    }
  } else {
    const merged = new Map(linked.flatMap(item => item.records).map(record => [recordKey(record), clone(record)]))
    group.records = [...merged.values()]
    group.depends_on = [...new Set(linked.flatMap(item => item.depends_on ?? []))].filter(op => !blocked.has(op))
    snapshot.outbox = snapshot.outbox.filter(item => item === group || !blocked.has(item.operation_id))
    for (const record of group.records) {
      const remote = group.conflict.find(item => item.table === record.table && item.id === record.data.id)?.remote
      record.data.row_version = remote?.row_version ?? 0
      if (record.table === 'schede' && remote) record.data.revisione = remote.revisione + 1
    }
    group.operation_id = crypto.randomUUID()
    group.generation = crypto.randomUUID()
    delete group.payload
    delete group.conflict
    group.status = 'pending'
    group.authorized = false // Scelta esplicita, poi invio manuale.
    delete group.error
  }
}

export function createSyncEngine({ read, commit, remote }) {
  let running = false
  return async function synchronize(manual = false) {
    if (running) return
    running = true
    try {
      const attempted = new Set()
      while (true) {
        const snapshot = read()
        const group = nextSendableGroup(snapshot,manual,attempted)
        if (!group) break
        const op = group.operation_id
        attempted.add(op)
        try {
          // Il confronto preliminare legge solo le righe del gruppo, senza scaricare altro.
          let inspected
          if (!group.payload && remote.inspect) {
            inspected = await remote.inspect(clone(group.records))
            if (inspected.some(item => (item.remote?.row_version ?? 0) !== (item.local.row_version ?? 0))) {
              throw Object.assign(new Error('Conflitto'), { code: '40001', conflict: inspected })
            }
          }
          // Payload congelato e salvato PRIMA della prima chiamata. Mai rigenerarlo al retry.
          await commit(draft => {
            const current = draft.outbox.find(g => g.operation_id === op)
            if (!current) throw new Error('Gruppo cambiato: riprova la sincronizzazione')
            freeze(current)
            if (inspected) for (const item of current.payload.modifiche) {
              if (item.tabella === 'schede') {
                const online = inspected.find(r => r.table === 'schede' && r.id === item.dati.id)?.remote
                if (online) item.dati.revisione = online.revisione + 1
              }
            }
          })
          const frozen = read().outbox.find(g => g.operation_id === op)
          if (!frozen?.payload) continue
          const receipt = await remote.send(clone(frozen.payload))
          await commit(draft => acknowledge(draft, op, receipt))
        } catch (error) {
          if (error.code === '40001') {
            const conflict = error.conflict ?? await Promise.all(group.records.map(async record => ({ table: record.table, id: record.data.id, local: clone(record.data), remote: await remote.row(record.table, record.data.id) })))
            await commit(draft => { const item = draft.outbox.find(g => g.operation_id === op); if (item) Object.assign(item, { status: 'conflict', conflict, error: 'Conflitto: scegli quale versione conservare.' }) })
          } else {
            await commit(draft => { const item = draft.outbox.find(g => g.operation_id === op); if (item) item.error = error.message })
            // Errori di accesso/rete interessano anche i gruppi seguenti.
            if (!error.code || error.status === 401 || error.status >= 500) throw error
          }
        }
      }
      if (manual) await commitDownload()
    } finally { running = false }
  }
  async function commitDownload() {
    const data = await remote.download()
    await commit(draft => mergeDownload(draft, data))
  }
}
