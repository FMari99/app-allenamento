import { getRow, sessionRows, exerciseForResult, measures, prefixed } from './session.js'
import { validateValues } from './categories.js'
import { queueSession } from '../sync/local-groups.js'

export function reviewDraft(data, sessionId) {
  return Object.fromEntries(sessionRows(data,sessionId).filter(row=>row.stato==='completato').map(row=>[row.id,measures(row,'effettivo')]))
}
export function reviewChanged(data, sessionId, draft) {
  return Object.entries(draft).some(([id,values])=>{
    const row=sessionRows(data,sessionId).find(row=>row.id===id)
    return row && Object.entries(values).some(([key,value])=>value!==measures(row,'effettivo')[key])
  })
}
export function saveSessionReview(snapshot,sessionId,draft,now=new Date().toISOString()) {
  const session=getRow(snapshot.data,'sessioni',sessionId)
  if(!session || session.deleted_at || !session.terminata_at)throw new Error('Sessione conclusa non disponibile')
  const rows=sessionRows(snapshot.data,sessionId)
  const changes=Object.entries(draft).map(([id,values])=>{
    const row=rows.find(row=>row.id===id)
    if(!row || row.stato!=='completato')throw new Error('Puoi correggere soltanto risultati confermati di questa sessione')
    validateValues(exerciseForResult(snapshot.data,row).exercise.categoria,values)
    return {row,values}
  }).filter(({row,values})=>Object.entries(values).some(([key,value])=>value!==measures(row,'effettivo')[key]))
  // Validare tutto prima di modificare; orari e stati originali restano quelli dell'esecuzione.
  for(const {row,values} of changes)Object.assign(row,prefixed(values,'effettivo'),{updated_at:now})
  if(changes.length)queueSession(snapshot,sessionId,'correzione_risultati',false)
  return changes.length
}
