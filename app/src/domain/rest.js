import { canExecute } from './execution.js'
import { getRow, sessionRows, updateCurrent, measures } from './session.js'
export const restFields=['recupero_serie_secondi','recupero_esercizio_secondi']
export function restSettings(entry,prefix='corrente') {return Object.fromEntries(restFields.map(key=>[key,entry[`${prefix}_${key}`] ?? null]))}
export function validateRest(values) {
 for(const field of restFields){const value=values[field];if(value!==null && (!Number.isInteger(value)||value<0||value>2147483647))throw new Error('I recuperi devono essere secondi interi non negativi, oppure non impostati.')}
 return values
}
export function changeRest(data,entryId,values) {
 validateRest(values)
 const entry=getRow(data,'esercizi_allenamento',entryId),exercise=entry && getRow(data,'esercizi',entry.esercizio_id)
 if(!exercise)throw new Error('Esercizio non disponibile')
 const [plan,updated]=updateCurrent(data,entryId,measures(entry,'corrente'))
 for(const field of restFields)updated[`corrente_${field}`]=values[field]
 return [plan,updated]
}
const localState=snapshot=>(snapshot.local ??= {sets:{}})
export function setCount(snapshot,resultId){return snapshot.local?.sets?.[resultId]?.count ?? 0}
export function currentRest(snapshot,sessionId){const rest=snapshot.local?.rest;return rest?.sessionId===sessionId ? rest : null}
export function restRemaining(rest,now=Date.now()){return rest ? Math.max(0,Math.ceil((rest.endsAt-now)/1000)) : 0}
export function restText(seconds){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
export function recordSet(snapshot,resultId,now=Date.now()) {
 const result=getRow(snapshot.data,'esercizi_sessione',resultId),session=result && getRow(snapshot.data,'sessioni',result.sessione_id)
 if(!session || session.terminata_at || session.deleted_at)throw new Error('Contatore disponibile solo durante la sessione')
 if(!canExecute(snapshot,resultId))throw new Error('Questo esercizio non è ancora iniziato')
 const target=result.effettivo_serie
 if(!Number.isInteger(target)||target<1)throw new Error('Indica prima il numero di serie')
 if(restRemaining(currentRest(snapshot,session.id),now)>0)throw new Error('Attendi oppure salta il recupero prima di segnare un’altra serie')
 const local=localState(snapshot);local.sets ??= {}
 const state=local.sets[resultId] ??= {count:0,history:[]}
 if(state.count>=target)throw new Error('Tutte le serie sono già contate')
 const rows=sessionRows(snapshot.data,session.id),index=rows.findIndex(r=>r.id===resultId),last=state.count+1===target
 const entry=getRow(snapshot.data,'esercizi_allenamento',result.esercizio_allenamento_id)
 const seconds=entry?.[`corrente_recupero_${last ? 'esercizio' : 'serie'}_secondi`] ?? 0
 const timerId=crypto.randomUUID()
 state.count+=1;state.history.push(timerId)
 // L’ultimo esercizio non ha un recupero successivo alla sua ultima serie.
 if(last && seconds>0 && index<rows.length-1){local.postExerciseRest ??= {};local.postExerciseRest[resultId]=timerId}
 local.rest=seconds>0 && (!last || index<rows.length-1) ? {id:timerId,sessionId:session.id,sourceId:resultId,targetId:last ? rows[index+1].id : resultId,kind:last ? 'esercizio' : 'serie',endsAt:now+seconds*1000,duration:seconds} : null
}
export function undoSet(snapshot,resultId) {
 const state=snapshot.local?.sets?.[resultId]
 if(!state?.count)return
 const timerId=state.history.pop();state.count-=1
 if(snapshot.local.postExerciseRest?.[resultId]===timerId)delete snapshot.local.postExerciseRest[resultId]
 if(snapshot.local.rest?.id===timerId)snapshot.local.rest=null
}
export function dismissRest(snapshot,sessionId) {
 const rest=snapshot.local?.rest
 if(rest?.sessionId!==sessionId)return
 if(rest.kind==='esercizio'){snapshot.local.postExerciseRest ??= {};snapshot.local.postExerciseRest[rest.sourceId]=rest.id}
 snapshot.local.rest=null
}
export function afterExercise(snapshot,resultId,{skip=false,finished=false,now=Date.now()}={}) {
 const result=getRow(snapshot.data,'esercizi_sessione',resultId),rest=snapshot.local?.rest
 const session=getRow(snapshot.data,'sessioni',result.sessione_id)
 if(session?.terminata_at){dismissRest(snapshot,result.sessione_id);return}
 if(finished || (skip && (rest?.sourceId===resultId || rest?.targetId===resultId))){dismissRest(snapshot,result.sessione_id);return}
 if(skip)return
 const rows=sessionRows(snapshot.data,result.sessione_id),index=rows.findIndex(r=>r.id===resultId)
 if(index<0 || index>=rows.length-1)return
 // Il recupero dopo esercizio avviato dall’ultima serie prosegue senza riavvio.
 if(snapshot.local?.postExerciseRest?.[resultId] || (rest?.sourceId===resultId && rest.kind==='esercizio'))return
 const entry=getRow(snapshot.data,'esercizi_allenamento',result.esercizio_allenamento_id),seconds=entry?.corrente_recupero_esercizio_secondi ?? 0
 const local=localState(snapshot)
 if(seconds>0){local.postExerciseRest ??= {};local.postExerciseRest[resultId]=true}
 local.rest=seconds>0 ? {id:crypto.randomUUID(),sessionId:result.sessione_id,sourceId:resultId,targetId:rows[index+1].id,kind:'esercizio',endsAt:now+seconds*1000,duration:seconds} : null
}
