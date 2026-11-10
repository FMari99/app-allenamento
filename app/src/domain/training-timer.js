import { getRow,sessionRows,measures,active } from './session.js'
import { validateValues } from './categories.js'
import { recordSet,setCount,dismissRest,restRemaining,afterExercise } from './rest.js'
import { advanceExercise,currentExerciseIndex,executionSettings } from './execution.js'
import { exerciseEquipment } from './equipment.js'
const local=s=>(s.local ??= {})
const make=(s,row,kind,seconds,now,extra={})=>(local(s).rest={id:crypto.randomUUID(),sessionId:row.sessione_id,sourceId:row.id,targetId:row.id,kind,duration:seconds,endsAt:now+seconds*1000,...extra})
export function timedExercise(snapshot,id){const row=getRow(snapshot.data,'esercizi_sessione',id),entry=row && getRow(snapshot.data,'esercizi_allenamento',row.esercizio_allenamento_id),exercise=entry && getRow(snapshot.data,'esercizi',entry.esercizio_id);return {row,entry,exercise}}
export function startWorkTimer(snapshot,id,now=Date.now(),{prepare=true}={}) {
 const {row,exercise}=timedExercise(snapshot,id),session=row && getRow(snapshot.data,'sessioni',row.sessione_id)
 if(!session || session.deleted_at || session.terminata_at || row.deleted_at || row.stato!=='da_eseguire')throw new Error('Timer disponibile soltanto per l’esercizio corrente da eseguire')
 const rows=sessionRows(snapshot.data,session.id)
 if(rows.findIndex(r=>r.id===id)!==currentExerciseIndex(snapshot,session.id))throw new Error('Riprendi prima l’esercizio corrente')
 if(!['durata','durata_carico','distanza_durata'].includes(exercise.categoria))throw new Error('Questo esercizio non è a durata')
 validateValues(exercise.categoria,measures(row,'effettivo'))
 const count=setCount(snapshot,id),target=row.effettivo_serie ?? 1
 if(count>=target)throw new Error('Le serie sono già terminate')
 const settings=executionSettings(snapshot),seconds=prepare ? settings.preparationSeconds : 0
 return make(snapshot,row,seconds>0 ? 'prepare' : 'work',seconds>0 ? seconds : row.effettivo_durata_secondi,now,{workSeconds:row.effettivo_durata_secondi,automatic:settings.autoSequence,series:count+1,total:target})
}
export function startTimer(snapshot,id,now=Date.now()) {
 if(snapshot.local?.rest)throw new Error('Termina o interrompi prima il timer in corso')
 return startWorkTimer(snapshot,id,now)
}
export function completeSet(snapshot,id,now=Date.now()) {
 const {row,exercise}=timedExercise(snapshot,id),session=row && getRow(snapshot.data,'sessioni',row.sessione_id)
 if(!row || row.stato!=='da_eseguire' || !session || session.terminata_at || session.deleted_at)throw new Error('Esercizio già concluso o non disponibile')
 validateValues(exercise.categoria,measures(row,'effettivo'))
 if(restRemaining(snapshot.local?.rest,now)>0)throw new Error('Concludi prima il timer in corso')
 const one=!row.effettivo_serie
 if(one){local(snapshot).sets ??= {};local(snapshot).sets[id]={count:1,history:[]};local(snapshot).rest=null}
 else recordSet(snapshot,id,now)
 const target=row.effettivo_serie ?? 1,last=setCount(snapshot,id)>=target
 if(!last){if(snapshot.local.rest){snapshot.local.rest.automatic=executionSettings(snapshot).autoSequence;snapshot.local.rest.workSeconds=row.effettivo_durata_secondi ?? null}else if(executionSettings(snapshot).autoSequence && row.effettivo_durata_secondi)startWorkTimer(snapshot,id,now);return {finished:false}}
 const rest=snapshot.local?.rest
 snapshot.ui.position=sessionRows(snapshot.data,session.id).findIndex(r=>r.id===id)
 const outcome=advanceExercise(snapshot,id,measures(row,'effettivo'),{now:new Date(now).toISOString()})
 if(one && !outcome.finished)afterExercise(snapshot,id,{now})
 if(outcome.finished)local(snapshot).rest=null
 else if(rest){rest.automatic=false;rest.kind='esercizio';local(snapshot).rest=rest}
 return outcome
}
export function restartTimer(snapshot,now=Date.now()) {
 const timer=snapshot.local?.rest
 if(!timer)throw new Error('Timer non disponibile')
 if(['work','prepare'].includes(timer.kind)){startWorkTimer(snapshot,timer.sourceId,now);return}
 timer.id=crypto.randomUUID();timer.endsAt=now+timer.duration*1000
}
export function continueTimer(snapshot,now=Date.now()) {
 const timer=snapshot.local?.rest
 if(!timer)return {finished:false}
 const {row}=timedExercise(snapshot,timer.sourceId)
 if(timer.kind==='prepare')return {timer:make(snapshot,row,'work',timer.workSeconds,now,{workSeconds:timer.workSeconds,automatic:timer.automatic,series:timer.series,total:timer.total})}
 if(timer.kind==='work'){
  if(now<timer.endsAt){local(snapshot).rest=null;return {finished:false,interrupted:true}}
  local(snapshot).rest=null
  return completeSet(snapshot,row.id,now)
 }
 dismissRest(snapshot,timer.sessionId)
 if(timer.kind==='serie' && timer.automatic && timer.workSeconds && row.stato==='da_eseguire')startWorkTimer(snapshot,row.id,now)
 return {finished:false}
}
// Una sola fase per commit: mai recuperare serie immaginarie durante una sospensione.
export function tickTimer(snapshot,id,now=Date.now()) {
 const t=snapshot.local?.rest
 if(!t || t.id!==id || now<t.endsAt || now-t.endsAt>2500)return {finished:false}
 if(t.kind==='prepare' || (t.automatic && ['work','serie'].includes(t.kind)))return continueTimer(snapshot,now)
 return {finished:false}
}
export function canTickTimer(timer,now=Date.now()){return Boolean(timer && now>=timer.endsAt && now-timer.endsAt<=2500 && (timer.kind==='prepare' || timer.automatic && ['work','serie'].includes(timer.kind)))}
export function timerNextDetails(snapshot) {
 const t=snapshot.local?.rest
 if(!t)return null
 const {row}=timedExercise(snapshot,t.sourceId)
 if(!row)return null
 if(['work','prepare'].includes(t.kind))return {label:'Serie',name:`${t.series ?? setCount(snapshot,row.id)+1} di ${t.total ?? row.effettivo_serie ?? 1}`,preparation:''}
 if(t.kind==='serie')return {label:'Prossima serie',name:`${setCount(snapshot,row.id)+1} di ${row.effettivo_serie ?? 1}`,preparation:''}
 const next=getRow(snapshot.data,'esercizi_sessione',t.targetId),details=next && timedExercise(snapshot,next.id)
 if(!details?.exercise)return {label:'',name:'Riprendi allenamento',preparation:''}
 const tools=[...new Set(exerciseEquipment(snapshot.data,details.exercise.id).map(t=>t.nome).filter(Boolean))]
 const load=details.row.effettivo_carico_kg
 const preparation=[...tools,...(Number.isFinite(load) && load>0 ? [`carico ${new Intl.NumberFormat('it-IT').format(load)} kg`] : [])].join(' · ')
 return {label:'Prossimo esercizio',name:details.exercise.nome,preparation}
}

export function timerNext(snapshot) {
 const next=timerNextDetails(snapshot)
 return next ? `${next.label ? next.label+(next.label==='Serie' ? ' ' : ': ') : ''}${next.name}${next.preparation ? ` (${next.preparation})` : ''}` : ''
}
