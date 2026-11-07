import { categories, validateValues } from './categories.js'

export const tables = ['strumenti', 'esercizi', 'esercizi_strumenti', 'attrezzatura_disponibile', 'schede', 'allenamenti', 'esercizi_allenamento', 'sessioni', 'esercizi_sessione']
export const measureFields = ['serie', 'ripetizioni', 'carico_kg', 'durata_secondi', 'distanza_metri']
export const active = rows => rows.filter(row => !row.deleted_at)
export const ordered = rows => [...rows].sort((a, b) => a.posizione - b.posizione)
export const emptyData = () => Object.fromEntries(tables.map(table => [table, []]))
export const getRow = (data, table, id) => data[table].find(row => row.id === id)
export const measures = (row, prefix) => Object.fromEntries(measureFields.map(key => [key, row[`${prefix}_${key}`] ?? null]))
export const prefixed = (values, prefix) => Object.fromEntries(measureFields.map(key => [`${prefix}_${key}`, values[key] ?? null]))
export function dayInZone(date, zone) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(date))
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-')
}
export function sessionStatus(session, now = new Date()) {
  if (session.terminata_at) return 'conclusa'
  return dayInZone(session.iniziata_at, session.fuso_orario) === dayInZone(now, session.fuso_orario) ? 'in corso' : 'incompleta'
}
export function sessionRows(data, sessionId) {
  return ordered(data.esercizi_sessione.filter(row => row.sessione_id === sessionId && !row.deleted_at))
}
export function progress(data, sessionId) {
  const rows = sessionRows(data, sessionId)
  const completed = rows.filter(row => row.stato === 'completato').length
  return { completed, total: rows.length, percent: rows.length ? Math.round(completed / rows.length * 100) : 0 }
}
export function suggestedWorkout(data, planId) {
  const workouts = ordered(active(data.allenamenti).filter(row => row.scheda_id === planId && row.tipo !== 'riscaldamento'))
  const last = active(data.sessioni).filter(session => session.terminata_at && workouts.some(w => w.id === session.allenamento_id))
    .sort((a, b) => b.terminata_at.localeCompare(a.terminata_at))[0]
  const index = last ? workouts.findIndex(w => w.id === last.allenamento_id) : -1
  return workouts.length ? workouts[(index + 1) % workouts.length] : null
}
export function exerciseForResult(data, result) {
  const entry = getRow(data, 'esercizi_allenamento', result.esercizio_allenamento_id)
  const exercise = entry && getRow(data, 'esercizi', entry.esercizio_id)
  if (!entry || !exercise) throw new Error('Riferimenti locali incompleti: non eliminare lo storico')
  return { entry, exercise }
}
function common(id, now) {
  return { id, created_at: now, updated_at: now, row_version: 0, deleted_at: null }
}
// Il piano conserva un solo blocco, la sessione ne registra l’esecuzione specifica.
export function workoutEntries(data, workoutId) {
  const workout=getRow(data,'allenamenti',workoutId)
  if(!workout || workout.tipo==='riscaldamento')return []
  const warmup=workout.riscaldamento_id && getRow(data,'allenamenti',workout.riscaldamento_id)
  if(workout.riscaldamento_id && (!warmup || warmup.deleted_at || warmup.tipo!=='riscaldamento' || warmup.scheda_id!==workout.scheda_id))throw new Error('Riscaldamento non disponibile: scarica la scheda aggiornata')
  const entries=id=>ordered(active(data.esercizi_allenamento).filter(e=>e.allenamento_id===id))
  return [...(warmup ? entries(warmup.id) : []),...entries(workoutId)]
}
export function startSession(data, workoutId, { now = new Date().toISOString(), zone = Intl.DateTimeFormat().resolvedOptions().timeZone, uuid = () => crypto.randomUUID() } = {}) {
  if (active(data.sessioni).some(session => sessionStatus(session, now) === 'in corso')) throw new Error('Riprendi o termina la sessione già in corso')
  const workout = getRow(data, 'allenamenti', workoutId)
  const plan = workout && getRow(data, 'schede', workout.scheda_id)
  const entries = workoutEntries(data,workoutId)
  if (!plan || plan.deleted_at || workout.deleted_at || !entries.length) throw new Error('Allenamento non disponibile o senza esercizi')
  const session = { ...common(uuid(), now), allenamento_id: workoutId, scheda_revisione: plan.revisione,
    scheda_nome_snapshot: plan.nome, allenamento_nome_snapshot: workout.nome,
    iniziata_at: now, terminata_at: null, fuso_orario: zone }
  dayInZone(now, zone)
  const results = entries.map((entry,index) => {
    const exercise = getRow(data, 'esercizi', entry.esercizio_id)
    if (!exercise || exercise.deleted_at) throw new Error('Catalogo incompleto per questo allenamento')
    const values = measures(entry, 'corrente')
    validateValues(exercise.categoria, values)
    return { ...common(uuid(), now), sessione_id: session.id, esercizio_allenamento_id: entry.id,
      posizione: index+1, stato: 'da_eseguire', completato_at: null, ...prefixed(values, 'effettivo') }
  })
  data.sessioni.push(session)
  data.esercizi_sessione.push(...results)
  return session.id
}
export function editResult(data, resultId, patch, { confirm = false, skip = false, now = new Date().toISOString() } = {}) {
  const result = getRow(data, 'esercizi_sessione', resultId)
  if (!result || result.deleted_at || getRow(data,'sessioni',result.sessione_id)?.deleted_at) throw new Error('Risultato non disponibile')
  const { exercise } = exerciseForResult(data, result)
  const values = skip ? Object.fromEntries(measureFields.map(key => [key, null])) : { ...measures(result, 'effettivo'), ...patch }
  if (!skip) validateValues(exercise.categoria, values, { partial: !confirm })
  Object.assign(result, prefixed(values, 'effettivo'), { stato: skip ? 'saltato' : confirm ? 'completato' : 'da_eseguire', completato_at: confirm ? now : null, updated_at: now })
  return result.sessione_id
}
export function finishSession(data, sessionId, now = new Date().toISOString()) {
  const session = getRow(data, 'sessioni', sessionId)
  if (!session || session.terminata_at) throw new Error('Sessione già conclusa o non trovata')
  const rows = sessionRows(data, sessionId)
  if (!rows.length || rows.some(row => row.stato === 'da_eseguire')) throw new Error('Conferma o salta gli esercizi mancanti prima di terminare')
  if (new Date(now) < new Date(session.iniziata_at)) throw new Error('Controlla data e ora del dispositivo')
  Object.assign(session, { terminata_at: now, updated_at: now })
}
export function updateCurrent(data, entryId, values, now = new Date().toISOString()) {
  const entry = getRow(data, 'esercizi_allenamento', entryId)
  const exercise = entry && getRow(data, 'esercizi', entry.esercizio_id)
  if (!entry || entry.deleted_at || !exercise) throw new Error('Voce del piano non più modificabile')
  validateValues(exercise.categoria, values)
  const workout = getRow(data, 'allenamenti', entry.allenamento_id)
  const plan = getRow(data, 'schede', workout.scheda_id)
  Object.assign(entry, prefixed(values, 'corrente'), { updated_at: now })
  plan.revisione += 1
  plan.updated_at = now
  return [plan, entry]
}
export function setInventory(data, ids, now = new Date().toISOString(), uuid = () => crypto.randomUUID()) {
  const selected = new Set(ids)
  if ([...selected].some(id => !active(data.strumenti).some(tool => tool.id === id))) throw new Error('Strumento non disponibile')
  const changes = []
  for (const tool of active(data.strumenti)) {
    let row = data.attrezzatura_disponibile.find(item => item.strumento_id === tool.id)
    if (!row && selected.has(tool.id)) {
      row = { ...common(uuid(), now), strumento_id: tool.id }
      data.attrezzatura_disponibile.push(row)
      changes.push(row)
    } else if (row && selected.has(tool.id) === Boolean(row.deleted_at)) {
      row.deleted_at = selected.has(tool.id) ? null : now
      row.updated_at = now
      changes.push(row)
    }
  }
  return changes
}
export function formatDuration(session, now = new Date()) {
  if (!session.terminata_at && sessionStatus(session, now) === 'incompleta') return 'Nessuna durata finale'
  const seconds = Math.max(0, Math.floor((new Date(session.terminata_at ?? now) - new Date(session.iniziata_at)) / 1000))
  return `${Math.floor(seconds / 3600) ? Math.floor(seconds / 3600) + ' h ' : ''}${Math.floor(seconds / 60) % 60} min`
}
export function confirmedHistory(data, exerciseId) {
  return data.esercizi_sessione.filter(row => !row.deleted_at && row.stato === 'completato' && exerciseForResult(data, row).exercise.id === exerciseId)
    .sort((a, b) => b.completato_at.localeCompare(a.completato_at))
}
