import { getRow, sessionRows, editResult, finishSession } from './session.js'
import { queueSession, enqueue } from '../sync/local-groups.js'
export function elapsedClock(session, now = Date.now()) {
  const end=Date.parse(session.terminata_at ?? new Date(now).toISOString())
  const seconds=Math.max(0,Math.floor((end-Date.parse(session.iniziata_at))/1000))
  return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':')
}
export const executionSettings=snapshot=>({immersive:true,arrows:true,sound:false,soundId:'double',autoSequence:false,preparationSeconds:5,...snapshot.local?.settings})
export function currentExerciseIndex(snapshot,sessionId) {
 const rows=sessionRows(snapshot.data,sessionId),session=getRow(snapshot.data,'sessioni',sessionId)
 if(session?.terminata_at)return Math.max(0,rows.length-1)
 const first=rows.findIndex(r=>r.stato==='da_eseguire')
 const lastProcessed=rows.reduce((last,r,i)=>['completato','saltato'].includes(r.stato) ? i : last,-1)
 return Math.min(rows.length-1,Math.max(first<0 ? rows.length-1 : first,lastProcessed+1,snapshot.local?.started?.[sessionId] ?? 0))
}
export function canExecute(snapshot,resultId) {
 const row=getRow(snapshot.data,'esercizi_sessione',resultId),session=row && getRow(snapshot.data,'sessioni',row.sessione_id)
 return Boolean(row && !row.deleted_at && session && !session.deleted_at && sessionRows(snapshot.data,session.id).findIndex(r=>r.id===resultId)<=currentExerciseIndex(snapshot,session.id))
}
export function rememberStarted(snapshot,sessionId) {
 const local=snapshot.local ??= {};local.started ??= {}
 local.started[sessionId]=currentExerciseIndex(snapshot,sessionId)
}
export function cancelSession(snapshot,sessionId,now=new Date().toISOString()) {
 const session=getRow(snapshot.data,'sessioni',sessionId)
 if(!session || session.deleted_at || session.terminata_at)throw new Error('Puoi annullare soltanto una sessione aperta')
 const rows=sessionRows(snapshot.data,sessionId)
 // Tombstone e gruppo automatico cancellano anche copie già inviate; i payload tentati restano congelati.
 for(const row of [session,...rows]){row.deleted_at=now;row.updated_at=now}
 for(const group of snapshot.outbox)if(group.records.every(r=>r.table==='sessioni' ? r.data.id===sessionId : r.table==='esercizi_sessione' && r.data.sessione_id===sessionId)){group.authorized=true;group.kind='sessione_annullata'}
 enqueue(snapshot,`session:${sessionId}`,'sessione_annullata',true,[{table:'sessioni',data:session},...rows.map(data=>({table:'esercizi_sessione',data}))])
 if(snapshot.local){
  for(const row of rows)delete snapshot.local.sets?.[row.id]
  delete snapshot.local.started?.[sessionId]
  for(const row of rows)delete snapshot.local.postExerciseRest?.[row.id]
  if(snapshot.local.rest?.sessionId===sessionId)snapshot.local.rest=null
 }
 Object.assign(snapshot.ui,{page:'home',sessionId:null,position:0})
}
// Risultato, posizione, conclusione e coda condividono il commit locale del chiamante.
export function advanceExercise(snapshot, resultId, values, { skip=false, now=new Date().toISOString() } = {}) {
  const result=getRow(snapshot.data,'esercizi_sessione',resultId)
  const session=result && getRow(snapshot.data,'sessioni',result.sessione_id)
  if(!session || session.deleted_at || snapshot.ui.sessionId!==session.id) throw new Error('Sessione non disponibile')
  const rows=sessionRows(snapshot.data,session.id)
  const index=rows.findIndex(r=>r.id===resultId)
  if(index<0 || index!==snapshot.ui.position) throw new Error('L’esercizio è cambiato: riprendi dalla posizione corrente')
  if(!canExecute(snapshot,resultId))throw new Error('Questo esercizio non è ancora iniziato')
  const frontier=currentExerciseIndex(snapshot,session.id)
  const last=index===rows.length-1, wasClosed=Boolean(session.terminata_at)
  if(last && !wasClosed && Date.parse(now)<Date.parse(session.iniziata_at)) throw new Error('Controlla data e ora del dispositivo')
  editResult(snapshot.data,resultId,values,{confirm:!skip,skip,now})
  if(last && !wasClosed) {
    for(const row of rows) if(row.stato==='da_eseguire') editResult(snapshot.data,row.id,{}, {skip:true,now})
    finishSession(snapshot.data,session.id,now)
  }
  queueSession(snapshot,session.id,wasClosed ? 'correzione_risultati' : last ? 'sessione_conclusa' : 'sessione_in_corso',!wasClosed && last)
  if(!wasClosed){snapshot.local ??= {};snapshot.local.started ??= {};snapshot.local.started[session.id]=Math.max(frontier,Math.min(rows.length-1,index+1))}
  Object.assign(snapshot.ui,last ? {page:'home',position:0} : {position:index+1})
  return {finished:last && !wasClosed, corrected:last && wasClosed}
}
export function previousResultsPage(points, page, size=5) {
  const count=Math.max(1,Math.ceil(points.length/size))
  const index=Math.max(0,Math.min(page,count-1))
  return {page:index,count,rows:points.slice(index*size,(index+1)*size)}
}
export function resumePosition(data,sessionId) {
  const session=getRow(data,'sessioni',sessionId),rows=sessionRows(data,sessionId)
  if(!session || session.terminata_at)return 0
  const pending=rows.findIndex(row=>row.stato==='da_eseguire')
  return pending<0 ? Math.max(0,rows.length-1) : pending
}
