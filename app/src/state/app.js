import { proposeFuture,resolveFuture } from '../domain/future.js'
import { completeSet,startTimer,restartTimer,continueTimer,tickTimer } from '../domain/training-timer.js'
import { soundChoice } from '../platform/timer-sound.js'
import { shareUnchanged } from './snapshot.js'
import { createNavigation } from '../platform/navigation.js'
import { saveSessionReview } from '../domain/session-review.js'
import { nextSendableGroup } from '../sync/contract.js'
import { reactive } from 'vue'
import { openDatabase, loadSnapshot, commitSnapshot } from '../data/local/database.js'
import { enqueue, queueSession } from '../sync/local-groups.js'
import { getClient, remoteFor } from '../data/remote/client.js'
import { createSyncEngine, resolveConflict } from '../sync/engine.js'
import { seedDemoWarmups } from '../data/local/demo-warmups.js'
import { seedDemoRests } from '../data/local/demo-rest.js'
import { changeRest, undoSet, dismissRest, afterExercise } from '../domain/rest.js'
import { advanceExercise, cancelSession, canExecute, rememberStarted, currentExerciseIndex } from '../domain/execution.js'
import { finishPartialSession } from '../domain/home.js'
import { setVideo } from '../domain/consultation.js'
import { ensureExtraDemoPlan } from '../data/local/extra-demo-plan.js'
import { seedDemoHistory } from '../data/local/demo-history.js'
import { demoData } from '../data/local/demo.js'
import { emptyData, tables, getRow, startSession, editResult, finishSession, updateCurrent, setInventory, dayInZone } from '../domain/session.js'

const initialUI = () => ({ page: 'home', planId: null, sessionId: null, position: 0 })
export const appState = reactive({ snapshot: { data: emptyData(), outbox: [], ui: initialUI() }, ownerId: null, email: '', mode: 'login', toast: '', syncing: false, ready: false, saving: false, error: '', savedAt: null, offline: !navigator.onLine, offlineReady: false, updateReady: false, editorDirty: false, now: new Date().toISOString() })
let engine, database, revision = 0, activeWrites = 0, pending = Promise.resolve()
let navigation
const clone = value => JSON.parse(JSON.stringify(value))
const today=()=>dayInZone(new Date(),Intl.DateTimeFormat().resolvedOptions().timeZone)

export function canLeaveEditor(){
  if(!appState.editorDirty)return true
  if(appState.discardEditor){
    if(!window.confirm('Ci sono modifiche non salvate. Vuoi uscire e scartarle?'))return false
    appState.discardEditor();return true
  }
  appState.error='Salva o annulla le modifiche prima di uscire.';return false
}
export function back(){if(!navigation?.back())void navigate('calendar')}
function closeOverlay(){
  const dialog=[...document.querySelectorAll('dialog[open]')].at(-1)
  if(!dialog)return false
  if(dialog.dispatchEvent(new Event('cancel',{cancelable:true})))dialog.close()
  return true
}

async function openOwner(ownerId, email = '') {
  await pending
  database?.close()
  database = await openDatabase(ownerId)
  const stored = await loadSnapshot(database)
  const data = emptyData()
  for (const record of stored.records) if (tables.includes(record.table)) data[record.table].push(record.data)
  const snapshot = { data, outbox: stored.outbox, ui: stored.metadata?.ui ?? initialUI(), sync: stored.metadata?.sync ?? {}, local: stored.metadata?.local ?? { sets: {} } }
  revision = stored.metadata?.revision ?? 0
  if(ownerId === 'demo') {
    let changed=ensureExtraDemoPlan(data);changed=seedDemoRests(data,changed);changed=seedDemoWarmups(data)||changed
    if(changed)revision=await commitSnapshot(database,snapshot,revision)
  }
  appState.snapshot = snapshot
  if(snapshot.ui.page==='workout' && getRow(data,'sessioni',snapshot.ui.sessionId)?.terminata_at)snapshot.ui.page='review'
  if(snapshot.ui.page==='calendar'){
    const day=today()
    Object.assign(snapshot.ui,{day,month:day.slice(0,7)})
  }
  Object.assign(appState, { ownerId, email, mode: ownerId === 'demo' ? 'demo' : 'account', ready: true, error: '', editorDirty: false })
  navigation?.dispose()
  navigation=createNavigation({browser:window,read:()=>clone(appState.snapshot.ui),restore:ui=>act(s=>{
    s.ui=clone(ui)
    if(s.ui.page==='workout' && getRow(s.data,'sessioni',s.ui.sessionId)?.terminata_at)s.ui.page='review'
  }),canLeave:canLeaveEditor,closeOverlay})
  if (ownerId !== 'demo') localStorage.setItem('allenamento-owner-v1', JSON.stringify({ id: ownerId, email }))
  engine = ownerId === 'demo' ? null : createSyncEngine({ read: () => appState.snapshot, commit: async change => {
    if (!await act(change,{background:true})) throw new Error(appState.error)
  }, remote: remoteFor(ownerId) })
}
export async function initialize() {
  try {
    const cachedOwner = JSON.parse(localStorage.getItem('allenamento-owner-v1') ?? 'null')
    if (appState.offline && cachedOwner?.id) { await openOwner(cachedOwner.id, cachedOwner.email); return }
    const { data, error } = await getClient().auth.getSession()
    if (error) appState.error = 'Accesso da rinnovare. Puoi accedere nuovamente senza perdere i dati locali.'
    if (data.session) await openOwner(data.session.user.id, data.session.user.email)
    else {
      const previous = JSON.parse(localStorage.getItem('allenamento-owner-v1') ?? 'null')
      if (previous?.id) await openOwner(previous.id, previous.email)
      else appState.ready = true
    }
    getClient().auth.onAuthStateChange((event, session) => {
      // Non cambiare archivio durante un commit; l'accesso scaduto conserva la copia offline.
      if (session && appState.ownerId === session.user.id) appState.email = session.user.email
      if (event === 'SIGNED_OUT' && appState.mode === 'account') appState.error = 'Sessione scaduta. I dati restano qui: accedi nuovamente per inviarli.'
    })
    void synchronize(false)
  } catch (error) { appState.ready = true; appState.error = error.message }
}
export async function login(email, password) {
  if (appState.syncing || appState.saving) return
  try {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password })
    if (error) throw new Error('Accesso non riuscito. Controlla email, password e connessione.')
    await openOwner(data.user.id, data.user.email)
    void synchronize(false)
  } catch (error) { appState.error = error.message }
}
export async function enterDemo() { try { await openOwner('demo') } catch (error) { appState.error = error.message } }
export async function logout() {
  if (appState.syncing || appState.saving || appState.editorDirty) { appState.error = 'Completa o annulla la modifica in corso prima di uscire.'; return }
  if (appState.mode === 'account') { await getClient().auth.signOut({ scope: 'local' }); localStorage.removeItem('allenamento-owner-v1') }
  await pending
  database?.close(); database = null; engine = null
  navigation?.dispose();navigation=null
  Object.assign(appState, { ownerId: null, mode: 'login', email: '', snapshot: { data: emptyData(), outbox: [], ui: initialUI() }, error: '' })
}
export async function synchronize(manual = true) {
  if (!engine || appState.syncing || appState.offline) return
  if (!manual && !nextSendableGroup(appState.snapshot)) return
  if (manual && appState.editorDirty) { appState.error = 'Salva o annulla le modifiche prima di sincronizzare.'; return }
  appState.syncing = true
  if(manual)appState.error = ''
  try {
    // Una sola finestra invia e rinnova le versioni. Il controllo IDB blocca copie locali obsolete.
    if (!navigator.locks) throw new Error('La sincronizzazione richiede Chrome aggiornato e una connessione HTTPS (oppure localhost).')
    await navigator.locks.request(`allenamento-sync-${appState.ownerId}`, { ifAvailable: true }, async lock => {
      if (!lock) throw new Error('Sincronizzazione in corso in un’altra finestra.')
      await engine(manual)
    })
  } catch (error) { appState.error = error.message || 'Invio non riuscito: i dati sono conservati, riprova.' }
  finally { appState.syncing = false }
}
export async function chooseConflict(op, choice) {
  if (appState.syncing || appState.saving) return
  appState.syncing = true
  try {
    const blocked = new Set([op])
    let size
    do {
      size = blocked.size
      for (const group of appState.snapshot.outbox) if (group.depends_on?.some(id => blocked.has(id))) blocked.add(group.operation_id)
    } while (size !== blocked.size)
    const records = new Map(appState.snapshot.outbox.filter(g => blocked.has(g.operation_id)).flatMap(g => g.records).map(r => [`${r.table}:${r.data.id}`, r]))
    const conflict = []
    for (const record of records.values()) conflict.push({ table: record.table, id: record.data.id, local: clone(record.data), remote: await remoteFor(appState.ownerId).row(record.table, record.data.id) })
    await act(draft => {
      const group = draft.outbox.find(g => g.operation_id === op)
      if (!group) throw new Error('Gruppo non più disponibile')
      group.conflict = conflict
      resolveConflict(draft, op, choice)
    })
  } catch (error) { appState.error = error.message } finally { appState.syncing = false }
}
export function exportLocal() {
  const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), owner: appState.ownerId, ...clone(appState.snapshot) }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob), a = document.createElement('a')
  a.href = url; a.download = 'allenamento-copia-locale.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function act(change,{background=false}={}) {
  const operation = pending.then(async () => {
    activeWrites+=1
    if(!background){appState.saving = true;appState.error = ''}
    try {
      if (!database) throw new Error('Archivio locale non disponibile')
      const draft = clone(appState.snapshot)
      change(draft)
      revision = await commitSnapshot(database, draft, revision)
      const previousUI=clone(appState.snapshot.ui)
      appState.snapshot = shareUnchanged(appState.snapshot,draft)
      navigation?.sync(previousUI,clone(draft.ui))
      if(!background)appState.savedAt = new Date().toISOString()
      return true
    } catch (error) { appState.error = error.message; return false }
    finally {activeWrites-=1;if(!background)appState.saving = false}
  })
  pending = operation.catch(() => {})
  return operation
}
export const loadDemo = () => act(snapshot => {
  if (snapshot.data.schede.length || snapshot.data.sessioni.length) throw new Error('La demo è già caricata: nessun dato è stato sostituito')
  if (appState.mode !== 'demo') throw new Error('La demo è separata dal tuo account')
  snapshot.data = demoData()
  seedDemoWarmups(snapshot.data)
  snapshot.ui = { ...initialUI(), planId: snapshot.data.schede[0].id }
})
export const navigate = (page, extra = {}) => {
  if(!canLeaveEditor())return Promise.resolve(false)
  return act(snapshot => {
    if(page==='calendar' && snapshot.ui.page!=='calendar'){
      const day=today()
      Object.assign(snapshot.ui,{day,month:day.slice(0,7)})
    }
    const session=getRow(snapshot.data,'sessioni',extra.sessionId ?? snapshot.ui.sessionId)
    if(page==='workout' && session?.terminata_at)page='review'
    Object.assign(snapshot.ui,{page},extra)
  })
}
export const saveReview=(sessionId,draft)=>act(snapshot=>saveSessionReview(snapshot,sessionId,draft)).then(ok=>{if(ok)showToast('Risultati salvati');return ok})
export const begin = workoutId => act(snapshot => {
  const id = startSession(snapshot.data, workoutId)
  Object.assign(snapshot.ui, { page: 'workout', sessionId: id, position: 0 })
  queueSession(snapshot, id, 'sessione_in_corso', false)
})
export const saveResult = (id, values, options = {}) => act(snapshot => {
  if(!canExecute(snapshot,id))throw new Error('Questo esercizio non è ancora iniziato')
  const current=getRow(snapshot.data,'esercizi_sessione',id)
  rememberStarted(snapshot,current.sessione_id)
  const sessionId = editResult(snapshot.data, id, values, options)
  const session = getRow(snapshot.data, 'sessioni', sessionId)
  queueSession(snapshot, sessionId, session.terminata_at ? 'correzione_risultati' : 'sessione_in_corso', false)
})
export const finish = sessionId => autoAfter(act(snapshot => {
  finishSession(snapshot.data, sessionId)
  queueSession(snapshot, sessionId, 'sessione_conclusa', true)
  Object.assign(snapshot.ui, { page: 'history' })
}))
export const saveCurrent = (entryId, values) => act(snapshot => {
  const currentEntry = getRow(snapshot.data, 'esercizi_allenamento', entryId)
  const workout = getRow(snapshot.data, 'allenamenti', currentEntry.allenamento_id)
  const currentPlan = getRow(snapshot.data, 'schede', workout.scheda_id)
  const existing = snapshot.outbox.filter(g => (g.logical_id ?? g.id) === `plan:${currentPlan.id}`).at(-1)
  if (existing && !existing.payload && existing.status === 'pending') currentPlan.revisione -= 1
  const [plan, entry] = updateCurrent(snapshot.data, entryId, values)
  enqueue(snapshot, `plan:${plan.id}`, 'piano_modificato', false, [{ table: 'schede', data: plan }, { table: 'esercizi_allenamento', data: entry }])
})
export const saveInventory = ids => autoAfter(act(snapshot => {
  const rows = setInventory(snapshot.data, ids)
  if (rows.length) enqueue(snapshot, 'inventory', 'inventario_confermato', true, rows.map(data => ({ table: 'attrezzatura_disponibile', data })))
}))
function autoAfter(result) { return result.then(ok => { if (ok) void synchronize(false); return ok }) }
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { appState.offline = false; void synchronize(false) })
  window.addEventListener('offline', () => { appState.offline = true })
  window.addEventListener('beforeunload', event => { if (activeWrites>0 || appState.editorDirty) { event.preventDefault(); event.returnValue = '' } })
}

const clock = setInterval(() => { appState.now = new Date().toISOString(); if (document.visibilityState === 'visible') void synchronize(false) }, 30000)
if (import.meta.hot) import.meta.hot.dispose(() => clearInterval(clock))

export const saveVideo = (id, url) => act(snapshot => {
  const row = setVideo(snapshot.data,id,url)
  enqueue(snapshot, `video:${id}`, 'video_modificato', false, [{ table:'esercizi', data:row }])
})

export const loadDemoHistory = () => act(snapshot => {
  if (appState.mode !== 'demo') throw new Error('Storico fittizio disponibile solo nella demo')
  if (snapshot.sync?.demoHistoryLoaded) throw new Error('Storico dimostrativo già caricato')
  seedDemoHistory(snapshot.data)
  snapshot.sync = { ...snapshot.sync, demoHistoryLoaded:true }
})

export const finishPartial = sessionId => autoAfter(act(snapshot => {
  finishPartialSession(snapshot.data,sessionId)
  dismissRest(snapshot,sessionId)
  queueSession(snapshot,sessionId,'sessione_conclusa',true)
}))

let toastTimeout
export function showToast(message) {
  clearTimeout(toastTimeout)
  appState.toast=message
  toastTimeout=setTimeout(()=>{appState.toast=''},4500)
}
export async function completeExercise(id, values, options={}) {
  let outcome
  const ok=await act(snapshot=>{const row=getRow(snapshot.data,'esercizi_sessione',id);const index=snapshot.ui.position,frontier=currentExerciseIndex(snapshot,row.sessione_id);outcome=advanceExercise(snapshot,id,values,options);if(index>=frontier)afterExercise(snapshot,id,{skip:options.skip,finished:outcome.finished})})
  if(ok && outcome.finished){showToast('Allenamento completato 🎉');void synchronize(false)}
  else if(ok && outcome.corrected)showToast('Risultati aggiornati')
  return ok
}

function timerOutcome(outcome){if(outcome?.finished){showToast('Allenamento completato 🎉');void synchronize(false)}}
export async function countSet(id){let outcome;const ok=await act(s=>{outcome=completeSet(s,id)});if(ok)timerOutcome(outcome);return ok}
export const startExerciseTimer=id=>act(s=>startTimer(s,id))
export const restartActiveTimer=id=>act(s=>{if(!id || s.local?.rest?.id===id)restartTimer(s)})
export async function continueActiveTimer(id){let outcome;const ok=await act(s=>{if(!id || s.local?.rest?.id===id)outcome=continueTimer(s)});if(ok)timerOutcome(outcome);return ok}
export async function tickActiveTimer(id){let outcome;const ok=await act(s=>{outcome=tickTimer(s,id)},{background:true});if(ok)timerOutcome(outcome);return ok}
export const setAutoSequence=value=>act(s=>{(s.local ??= {}).settings={...s.local.settings,autoSequence:Boolean(value)};const t=s.local.rest;if(t && ['prepare','work','serie'].includes(t.kind))t.automatic=Boolean(value)})

export const uncountSet=id=>act(snapshot=>undoSet(snapshot,id))
export const skipRest=sessionId=>act(snapshot=>dismissRest(snapshot,sessionId))
export const saveRest=(entryId,values)=>act(snapshot=>{
  const entry=getRow(snapshot.data,'esercizi_allenamento',entryId),w=getRow(snapshot.data,'allenamenti',entry.allenamento_id),plan=getRow(snapshot.data,'schede',w.scheda_id)
  const previous=snapshot.outbox.filter(g=>(g.logical_id ?? g.id)===`plan:${plan.id}`).at(-1)
  if(previous && !previous.payload && previous.status==='pending')plan.revisione-=1
  const [updatedPlan,updatedEntry]=changeRest(snapshot.data,entryId,values)
  enqueue(snapshot,`plan:${plan.id}`,'piano_modificato',false,[{table:'schede',data:updatedPlan},{table:'esercizi_allenamento',data:updatedEntry}])
})

export const cancelWorkout=id=>autoAfter(act(snapshot=>cancelSession(snapshot,id))).then(ok=>{if(ok)showToast('Sessione annullata');return ok})
export const saveExecutionSettings=settings=>act(snapshot=>{
 const local=snapshot.local ??= {};local.settings={immersive:Boolean(settings.immersive),arrows:Boolean(settings.arrows),sound:Boolean(settings.sound),soundId:soundChoice(settings.soundId).id,autoSequence:Boolean(settings.autoSequence),preparationSeconds:Math.max(0,Math.min(30,Math.round(Number(settings.preparationSeconds)||0)))}
})

export const saveFuture=(resultId,values)=>act(s=>proposeFuture(s,resultId,values))
export const decideFuture=(resultId,choice,proposalId)=>act(s=>{
 resolveFuture(s,resultId,choice,proposalId)
 const row=getRow(s.data,'esercizi_sessione',resultId)
 queueSession(s,row.sessione_id,'sessione_in_corso',false)
})
