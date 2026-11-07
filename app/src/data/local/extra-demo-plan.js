const planId='00000000-0000-0000-0000-000000000090'
// Estensione idempotente della sola demo: non sostituisce dati o sessioni esistenti.
export function ensureExtraDemoPlan(data, now=new Date().toISOString()) {
  if (!data.schede.some(p=>!p.deleted_at) || data.schede.some(p=>p.id===planId)) return false
  const source=data.esercizi_allenamento.find(e=>!e.deleted_at && data.esercizi.some(c=>c.id===e.esercizio_id && !c.deleted_at))
  if(!source)return false
  const common={row_version:0,created_at:now,updated_at:now,deleted_at:null}
  const workoutId='00000000-0000-0000-0000-000000000091'
  data.schede.push({...common,id:planId,nome:'Demo essenziale',note:'Seconda scheda di prova: un allenamento e un esercizio.',revisione:1})
  data.allenamenti.push({...common,id:workoutId,scheda_id:planId,nome:'Allenamento semplice',note:null,posizione:1})
  data.esercizi_allenamento.push({...source,...common,id:'00000000-0000-0000-0000-000000000092',allenamento_id:workoutId,posizione:1,note:null})
  return true
}
