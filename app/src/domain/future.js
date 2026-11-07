import { getRow,measures,editResult } from './session.js'
import { validateValues } from './categories.js'
import { canExecute } from './execution.js'
import { enqueue } from '../sync/local-groups.js'
export function pendingFuture(snapshot,resultId) {
 const result=getRow(snapshot.data,'esercizi_sessione',resultId),session=result && getRow(snapshot.data,'sessioni',result.sessione_id),entry=result && getRow(snapshot.data,'esercizi_allenamento',result.esercizio_allenamento_id),p=entry?.proposta_futura
 if(!p || !session || session.deleted_at || session.terminata_at || result.deleted_at || result.stato!=='da_eseguire' || !canExecute(snapshot,resultId) || p.sessione_origine_id===session.id || p.rinviata_sessione_id===session.id)return null
 if(snapshot.local?.futureSeen?.[`${p.id}:${session.id}`])return null
 return p
}
function queueEntry(snapshot,entry) {
 const workout=getRow(snapshot.data,'allenamenti',entry.allenamento_id),plan=getRow(snapshot.data,'schede',workout.scheda_id)
 const previous=snapshot.outbox.filter(g=>(g.logical_id ?? g.id)===`plan:${plan.id}`).at(-1)
 if(!(previous && !previous.payload && previous.status==='pending'))plan.revisione+=1
 plan.updated_at=new Date().toISOString()
 enqueue(snapshot,`plan:${plan.id}`,'piano_modificato',false,[{table:'schede',data:plan},{table:'esercizi_allenamento',data:entry}])
}
export function proposeFuture(snapshot,resultId,values=null) {
 const result=getRow(snapshot.data,'esercizi_sessione',resultId),entry=result && getRow(snapshot.data,'esercizi_allenamento',result.esercizio_allenamento_id),exercise=entry && getRow(snapshot.data,'esercizi',entry.esercizio_id)
 if(!result || result.deleted_at || !entry || entry.deleted_at || !exercise)throw new Error('Voce non disponibile')
 if(values)validateValues(exercise.categoria,values)
 entry.proposta_futura={id:crypto.randomUUID(),sessione_origine_id:result.sessione_id,rinviata_sessione_id:null,promemoria:values===null,prima:measures(result,'effettivo'),valori:values}
 entry.updated_at=new Date().toISOString();queueEntry(snapshot,entry)
}
export function resolveFuture(snapshot,resultId,choice,expectedId) {
 const proposal=pendingFuture(snapshot,resultId)
 if(!proposal || expectedId && expectedId!==proposal.id || !['apply','later','cancel'].includes(choice))throw new Error('Proposta non più disponibile')
 const result=getRow(snapshot.data,'esercizi_sessione',resultId),entry=getRow(snapshot.data,'esercizi_allenamento',result.esercizio_allenamento_id)
 if(choice==='apply' && proposal.valori){
  validateValues(getRow(snapshot.data,'esercizi',entry.esercizio_id).categoria,proposal.valori)
  editResult(snapshot.data,resultId,proposal.valori)
  // L’incremento/coalescenza della revisione è gestito soltanto da queueEntry.
  for(const [key,value] of Object.entries(proposal.valori))entry[`corrente_${key}`]=value
 }
 if(choice==='later')entry.proposta_futura={...proposal,rinviata_sessione_id:result.sessione_id}
 else entry.proposta_futura=null
 const local=snapshot.local ??= {};local.futureSeen ??= {};local.futureSeen[`${proposal.id}:${result.sessione_id}`]=true
 queueEntry(snapshot,entry)
}
