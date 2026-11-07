import { active, ordered, getRow, sessionRows, editResult, finishSession } from './session.js'
const time = value => Date.parse(value) || 0
export function sessionActivity(data, session) {
  if(session.terminata_at) return time(session.terminata_at)
  return Math.max(time(session.iniziata_at), ...sessionRows(data,session.id).filter(r => r.stato === 'completato').map(r => time(r.completato_at)))
}
export function planSessions(data, planId) {
  const workouts = new Set(data.allenamenti.filter(w => w.scheda_id === planId).map(w => w.id))
  return active(data.sessioni).filter(s => workouts.has(s.allenamento_id)).sort((a,b) => sessionActivity(data,b)-sessionActivity(data,a) || time(b.iniziata_at)-time(a.iniziata_at) || a.id.localeCompare(b.id))
}
export function recentPlans(data) {
  const usage = new Map(active(data.schede).map(p => [p.id, planSessions(data,p.id)[0]]))
  return [...active(data.schede)].sort((a,b) => {
    const lastA=usage.get(a.id),lastB=usage.get(b.id)
    return (lastB ? sessionActivity(data,lastB) : 0)-(lastA ? sessionActivity(data,lastA) : 0) || time(b.created_at)-time(a.created_at) || a.nome.localeCompare(b.nome)
  })
}
export function homeWorkout(data, planId) {
  const workouts=ordered(active(data.allenamenti).filter(w => w.scheda_id === planId && w.tipo !== 'riscaldamento'))
  const latest=planSessions(data,planId).find(s => workouts.some(w => w.id === s.allenamento_id))
  if(!latest) return workouts[0] ?? null
  const index=workouts.findIndex(w => w.id===latest.allenamento_id)
  return latest.terminata_at ? workouts[(index+1)%workouts.length] : workouts[index]
}
export function openWorkoutSession(data, workoutId) {
  return active(data.sessioni).filter(s => s.allenamento_id === workoutId && !s.terminata_at).sort((a,b) => sessionActivity(data,b)-sessionActivity(data,a) || time(b.iniziata_at)-time(a.iniziata_at))[0] ?? null
}
export function lastConfirmedAt(data, sessionId) {
  const rows=sessionRows(data,sessionId).filter(r => r.stato==='completato' && Number.isFinite(Date.parse(r.completato_at)))
  return rows.sort((a,b)=>time(b.completato_at)-time(a.completato_at))[0]?.completato_at ?? null
}
export function finishPartialSession(data, sessionId, now = new Date().toISOString()) {
  const session=getRow(data,'sessioni',sessionId)
  if(!session || session.deleted_at || session.terminata_at) throw new Error('Sessione già conclusa o non disponibile')
  const end=lastConfirmedAt(data,sessionId)
  if(!end) throw new Error('Conferma almeno un esercizio prima di terminare: manca un orario di esecuzione.')
  if(time(end)<time(session.iniziata_at)) throw new Error('L’ultimo esercizio precede l’avvio: controlla gli orari della sessione.')
  for(const row of sessionRows(data,sessionId)) if(row.stato==='da_eseguire') editResult(data,row.id,{}, {skip:true,now})
  finishSession(data,sessionId,end)
  session.updated_at=now
  return session
}
