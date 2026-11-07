import { active, dayInZone, exerciseForResult, getRow } from './session.js'
import { safeVideo } from './presentation.js'
export function sessionsOnDay(data, day) {
  return active(data.sessioni).filter(s => dayInZone(s.iniziata_at, s.fuso_orario) === day).sort((a,b) => a.iniziata_at.localeCompare(b.iniziata_at))
}
export function monthDays(month) {
  const [year, number] = month.split('-').map(Number)
  const start = new Date(Date.UTC(year, number - 1, 1))
  const offset = (start.getUTCDay() + 6) % 7
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(Date.UTC(year, number - 1, 1 - offset + i))
    const day = date.toISOString().slice(0,10)
    return { day, number: date.getUTCDate(), current: day.startsWith(month) }
  })
}
export function exercisePoints(data, exerciseId) {
  return active(data.esercizi_sessione).filter(row => row.stato === 'completato' && exerciseForResult(data,row).exercise.id === exerciseId && getRow(data,'sessioni',row.sessione_id) && !getRow(data,'sessioni',row.sessione_id).deleted_at)
    .map(row => ({ ...row, at: row.completato_at, zone: getRow(data,'sessioni',row.sessione_id).fuso_orario }))
    .sort((a,b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
}
export function durationPoints(data, workoutId, revision) {
  return active(data.sessioni).filter(s => s.allenamento_id === workoutId && s.scheda_revisione === Number(revision) && s.terminata_at)
    .map(s => ({ id:s.id, at:s.iniziata_at, zone:s.fuso_orario, minuti:(Date.parse(s.terminata_at)-Date.parse(s.iniziata_at))/60000 }))
    .sort((a,b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
}
export function chartLayout(points, fields, independent = false) {
  const times = points.map(p => Date.parse(p.at)), first = Math.min(...times), last = Math.max(...times)
  const all = points.flatMap(p => fields.map(f => Number(p[f] ?? 0)))
  return fields.map(field => {
    const max = Math.max(1,...(independent ? points.map(p => Number(p[field] ?? 0)) : all))
    return { field, max, points:points.map((p,index) => ({ index, x:first === last ? 160 : 24+(times[index]-first)/(last-first)*272, y:144-Number(p[field] ?? 0)/max*120 })) }
  })
}
export function setVideo(data, id, value) {
  const exercise = getRow(data,'esercizi',id)
  if (!exercise || exercise.deleted_at) throw new Error('Esercizio non modificabile')
  const url = value.trim()
  if (url && !safeVideo(url)) throw new Error('Inserisci un collegamento http:// o https:// valido, oppure lascia vuoto per rimuoverlo.')
  exercise.video_url = url ? safeVideo(url) : null
  return exercise
}

export function keepPointSelection(points,previous,index) {
 const id=previous?.[index]?.id
 const found=id==null ? -1 : points.findIndex(p=>p.id===id)
 return found<0 ? Math.max(0,points.length-1) : found
}
