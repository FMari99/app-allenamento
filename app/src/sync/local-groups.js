import { getRow, sessionRows } from '../domain/session.js'
const clone = value => JSON.parse(JSON.stringify(value))
export const recordKey = record => `${record.table}:${record.data.id}`

export function enqueue(snapshot, id, kind, authorized, records) {
  const candidates = snapshot.outbox.filter(group => (group.logical_id ?? group.id) === id)
  const previous = candidates.at(-1)
  const editable = previous && !previous.payload && previous.status === 'pending' ? previous : null
  const merged = new Map((editable?.records ?? []).map(record => [recordKey(record), record]))
  for (const record of records) merged.set(recordKey(record), clone(record))
  const keys = new Set(merged.keys())
  const dependencies = new Set(editable?.depends_on ?? [])
  for (const group of snapshot.outbox) {
    if (group !== editable && group.records.some(record => keys.has(recordKey(record)))) dependencies.add(group.operation_id)
  }
  const group = { id: editable?.id ?? (previous ? `${id}:${crypto.randomUUID()}` : id), logical_id: id,
    operation_id: crypto.randomUUID(), generation: crypto.randomUUID(), kind, authorized, status: 'pending',
    updated_at: new Date().toISOString(), records: [...merged.values()], depends_on: [...dependencies] }
  if (editable) {
    snapshot.outbox = snapshot.outbox.filter(item => item !== editable)
    for (const item of snapshot.outbox) item.depends_on = (item.depends_on ?? []).map(op => op === editable.operation_id ? group.operation_id : op)
  }
  snapshot.outbox.push(group)
  return group
}
export function queueSession(snapshot, id, kind, authorized) {
  const correction = kind === 'correzione_risultati'
  return enqueue(snapshot, `${correction ? 'correction' : 'session'}:${id}`, kind, authorized, [
    { table: 'sessioni', data: getRow(snapshot.data, 'sessioni', id) },
    ...sessionRows(snapshot.data, id).map(data => ({ table: 'esercizi_sessione', data })),
  ])
}
