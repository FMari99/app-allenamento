<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { appState, navigate, saveResult, completeExercise, saveVideo, countSet, uncountSet, skipRest, saveRest, cancelWorkout, startExerciseTimer, setAutoSequence, saveFuture, decideFuture } from '../state/app.js'
import { getRow, sessionRows, exerciseForResult, measures, active } from '../domain/session.js'
import { pendingFuture } from '../domain/future.js'
import { measureFields } from '../domain/session.js'
import { exercisePoints } from '../domain/consultation.js'
import { setCount, currentRest, restRemaining, restText, restSettings } from '../domain/rest.js'
import { elapsedClock, previousResultsPage, canExecute, currentExerciseIndex, executionSettings } from '../domain/execution.js'
import { valuesText, dateText, safeVideo } from '../domain/presentation.js'
import ExecutionSettings from '../components/ExecutionSettings.vue'
import { unlockAudio } from '../platform/timer-sound.js'
import ValuesForm from '../components/ValuesForm.vue'
const data=computed(()=>appState.snapshot.data)
const session=computed(()=>getRow(data.value,'sessioni',appState.snapshot.ui.sessionId))
const rows=computed(()=>sessionRows(data.value,session.value?.id))
const position=computed(()=>Math.max(0,Math.min(appState.snapshot.ui.position,rows.value.length-1)))
const result=computed(()=>rows.value[position.value])
const details=computed(()=>result.value && exerciseForResult(data.value,result.value))
const history=computed(()=>details.value ? exercisePoints(data.value,details.value.exercise.id).filter(r=>r.id!==result.value.id).reverse() : [])
const historyPage=ref(0), historyView=computed(()=>previousResultsPage(history.value,historyPage.value))
const equipment=computed(()=>details.value ? active(data.value.esercizi_strumenti).filter(a=>a.esercizio_id===details.value.exercise.id).map(a=>({...a,nome:getRow(data.value,'strumenti',a.strumento_id)?.nome,available:active(data.value.attrezzatura_disponibile).some(t=>t.strumento_id===a.strumento_id)})) : [])
const now=ref(Date.now()), processing=ref(false), menuOpen=ref(false), menuContainer=ref(null), menuButton=ref(null)
const dialog=ref(null), panel=ref(null), dialogError=ref(''), url=ref(''), editingVideo=ref(false)
const futureToken=ref(0),futureReminder=ref(false)
const futureProposal=computed(()=>result.value ? pendingFuture(appState.snapshot,result.value.id) : null)
const futureLabels={serie:'Serie',ripetizioni:'Ripetizioni',carico_kg:'Carico (kg)',durata_secondi:'Durata (s)',distanza_metri:'Distanza (m)'}
const futureDiff=computed(()=>{const p=futureProposal.value;if(!p?.valori)return [];return measureFields.filter(k=>p.valori[k]!=null && p.valori[k]!==p.prima[k]).map(k=>({key:k,label:futureLabels[k],before:p.prima[k] ?? '—',after:p.valori[k]}))})
const restDraft=ref({serie:'',esercizio:''}), pendingValues=ref(null)
const settings=computed(()=>executionSettings(appState.snapshot))
const executable=computed(()=>result.value && canExecute(appState.snapshot,result.value.id))
const frontier=computed(()=>session.value ? currentExerciseIndex(appState.snapshot,session.value.id) : 0)
const warmup=computed(()=>details.value && getRow(data.value,'allenamenti',details.value.entry.allenamento_id)?.tipo==='riscaldamento')
const counted=computed(()=>result.value ? setCount(appState.snapshot,result.value.id) : 0)
const rest=computed(()=>session.value ? currentRest(appState.snapshot,session.value.id) : null)
const timed=computed(()=>['durata','durata_carico','distanza_durata'].includes(details.value?.exercise.categoria))
const timerBusy=computed(()=>Boolean(rest.value))
const remaining=computed(()=>restRemaining(rest.value,now.value))
const titles={future:'Prossima volta',futureReview:'La tua proposta',settings:'Impostazioni',cancel:'Annulla sessione',rest:'Modifica timer',mismatch:'Conferma le serie',ai:'Suggerito dall’AI',equipment:'Attrezzatura',video:'Video',history:'Risultati precedenti'}
let timer,previousOverflow=''
onMounted(()=>{timer=setInterval(()=>{now.value=Date.now()},1000);document.addEventListener('click',outside)})
onUnmounted(()=>{clearInterval(timer);document.removeEventListener('click',outside);if(panel.value){dialog.value?.close();document.body.style.overflow=previousOverflow}})
function hideMenu(){menuOpen.value=false;menuButton.value?.focus()}
function outside(event){if(menuOpen.value && !menuContainer.value?.contains(event.target))menuOpen.value=false}
watch(()=>result.value?.id,()=>{menuOpen.value=false;historyPage.value=0})
async function openPanel(name){
  menuOpen.value=false;historyPage.value=0;dialogError.value='';panel.value=name
  futureReminder.value=Boolean(details.value.entry.proposta_futura?.promemoria)
  url.value=details.value.exercise.video_url ?? '';editingVideo.value=!safeVideo(url.value)
  const settings=restSettings(details.value.entry)
  restDraft.value={serie:settings.recupero_serie_secondi==null ? '' : restText(settings.recupero_serie_secondi),esercizio:settings.recupero_esercizio_secondi==null ? '' : restText(settings.recupero_esercizio_secondi)}
  await nextTick();previousOverflow=document.body.style.overflow;dialog.value.showModal();document.body.style.overflow='hidden'
}
function closePanel(){
  if(panel.value==='futureReview'){dialogError.value='Scegli Applica, Rimanda oppure Annulla proposta.';return}
  if(appState.editorDirty){dialogError.value='Salva o annulla le modifiche prima di chiudere.';return}
  dialog.value?.close()
}
function closedPanel(){panel.value=null;document.body.style.overflow=previousOverflow;menuButton.value?.focus()}
function cancelVideo(){url.value=details.value.exercise.video_url ?? '';appState.editorDirty=false;dialogError.value='';editingVideo.value=false}
async function storeVideo(){
  if(await saveVideo(details.value.exercise.id,url.value)){appState.editorDirty=false;editingVideo.value=false;dialogError.value=''}
  else dialogError.value=appState.error
}
function parseRest(text){
 const value=text.trim();if(!value)return null
 if(!/^\d+(?::[0-5]\d)?$/.test(value))throw new Error('Usa mm:ss oppure secondi interi; 0 disattiva il recupero.')
 const parts=value.split(':').map(Number);return parts.length===2 ? parts[0]*60+parts[1] : parts[0]
}
async function storeRest(){
 try{
  const values={recupero_serie_secondi:parseRest(restDraft.value.serie),recupero_esercizio_secondi:parseRest(restDraft.value.esercizio)}
  if(await saveRest(details.value.entry.id,values)){appState.editorDirty=false;dialog.value.close()}else dialogError.value=appState.error
 }catch(error){dialogError.value=error.message}
}
function cancelRest(){appState.editorDirty=false;dialog.value.close()}
async function advance(values={},skip=false){
 if(processing.value || appState.editorDirty || !executable.value || timerBusy.value)return
 if(settings.value.sound)void unlockAudio()
 if(!skip && !session.value.terminata_at && counted.value>0 && counted.value!==values.serie){pendingValues.value={...values};await openPanel('mismatch');return}
 await performAdvance(values,skip)
}
async function performAdvance(values,skip=false){
 processing.value=true
 try{if(await completeExercise(result.value.id,values,{skip}))window.scrollTo(0,0)}finally{processing.value=false}
}
async function resolveCount(useCount){
 const values={...pendingValues.value};if(useCount)values.serie=counted.value
 dialog.value.close();await nextTick();await performAdvance(values)
}
watch(()=>[futureProposal.value?.id,result.value?.id,Boolean(rest.value),panel.value],()=>{
 if(futureProposal.value && !rest.value && !panel.value && !appState.editorDirty)void openPanel('futureReview')
},{immediate:true,flush:'post'})
async function storeFuture(values=null){if(await saveFuture(result.value.id,values)){appState.editorDirty=false;dialog.value.close()}else dialogError.value=appState.error}
function cancelFuture(){appState.editorDirty=false;dialog.value.close()}
async function resolveProposal(choice){if(await decideFuture(result.value.id,choice,futureProposal.value?.id)){futureToken.value++;dialog.value.close()}else dialogError.value=appState.error}
async function startTimed(){if(settings.value.sound)void unlockAudio();await startExerciseTimer(result.value.id)}
async function markSet(){if(processing.value || !executable.value)return;if(settings.value.sound)void unlockAudio();processing.value=true;try{await countSet(result.value.id)}finally{processing.value=false}}
function move(delta){const target=position.value+delta;if(target>=0 && target<rows.value.length)void navigate('workout',{position:target})}
async function cancelCurrent(){
 if(processing.value)return
 processing.value=true
 try{if(await cancelWorkout(session.value.id)){appState.editorDirty=false;dialog.value?.close()}}finally{processing.value=false}
}

</script>
<template>
<section v-if="session && result" class="execution-screen">
  <header class="execution-toolbar"><span>{{ warmup ? 'Riscaldamento' : 'Esercizio' }} {{ position+1 }} di {{ rows.length }}</span><time class="execution-clock" aria-label="Tempo trascorso allenamento">[ {{ elapsedClock(session,now) }} ]</time><div ref="menuContainer" class="execution-menu-wrap" @keydown.esc="hideMenu"><button ref="menuButton" class="quiet" aria-label="Dettagli esercizio" :aria-expanded="menuOpen" aria-controls="execution-menu" @click="menuOpen=!menuOpen">⋯</button><nav v-if="menuOpen" id="execution-menu" class="execution-menu" aria-label="Dettagli esercizio"><button @click="openPanel('ai')">Suggerito dall’AI</button><button @click="openPanel('equipment')">Attrezzatura</button><button @click="openPanel('video')">Video</button><button @click="openPanel('history')">Risultati precedenti</button><button @click="openPanel('rest')">Modifica timer</button><button @click="openPanel('future')">Prossima volta</button><button @click="openPanel('settings')">Impostazioni</button><button @click="menuOpen=false;navigate('home')">Torna alla Home</button><button v-if="!session.terminata_at" class="danger-text" @click="openPanel('cancel')">Annulla sessione</button></nav></div></header>
  <p v-if="!executable" class="preview-notice" role="status">Anteprima · Questo esercizio sarà disponibile dopo quello corrente.<button class="quiet" @click="navigate('workout',{position:frontier})">Torna al corrente</button></p>
  <h1 class="execution-title">{{ details.exercise.nome }}</h1>
  <p v-if="details.exercise.istruzioni" class="execution-instructions">{{ details.exercise.istruzioni }}</p>
  <p v-if="details.entry.note" class="execution-instructions">{{ details.entry.note }}</p>
  <div v-if="equipment.length" class="equipment-summary"><span><strong>Attrezzatura:</strong> {{ equipment.map(t=>t.nome).join(', ') }}</span><button type="button" class="quiet" @click="openPanel('equipment')">Vedi tutto</button></div>
  <ValuesForm :key="`${result.id}-${futureToken}`" :reset-token="result.stato==='saltato'" :category="details.exercise.categoria" :locked="!executable || timerBusy" :initial="measures(result,'effettivo')" :disabled="appState.saving || processing || !executable" @change="saveResult(result.id,$event)" @confirm="advance($event)">
    <template #support="{values}"><div v-if="!session.terminata_at" class="execution-support">
    <section v-if="timed && executable" class="work-timer-controls"><div class="row"><strong>{{ values.serie>1 ? 'Timer delle serie' : 'Timer esercizio' }}</strong><small v-if="values.serie>1">{{ counted }} / {{ values.serie }}</small></div><label v-if="values.serie>1" class="auto-sequence"><input type="checkbox" role="switch" :checked="settings.autoSequence" @change="setAutoSequence($event.target.checked)" /><span>Sequenza automatica<small>Lavoro e pausa tra le serie</small></span></label><p class="small">{{ settings.preparationSeconds }} s per posizionarti prima della serie.</p><button type="button" class="primary full" :disabled="timerBusy || processing || appState.saving" @click="startTimed">Avvia timer</button></section>
    <section v-if="executable && !timed && values.serie>1" class="series-counter" aria-label="Contatore locale serie"><div class="row"><strong>Serie completate</strong><span class="series-tally">{{ counted }} <small>/ {{ values.serie ?? '—' }}</small></span></div><div class="series-track" aria-hidden="true"><span :style="{width:(values.serie>0 ? Math.min(100,counted/values.serie*100) : 0)+'%'}" /></div><div class="series-buttons"><button type="button" class="set-button" :disabled="result.stato!=='da_eseguire' || timerBusy || appState.saving || processing || remaining>0 || !Number.isInteger(values.serie) || values.serie<1 || counted>=values.serie" @click="markSet">Serie fatta ✓</button><button type="button" class="quiet" :disabled="result.stato!=='da_eseguire' || timerBusy || !counted || appState.saving" aria-label="Annulla ultima serie" @click="uncountSet(result.id)">↶ Annulla</button></div></section>

    </div></template>
    <template #actions><div class="execution-controls"><div class="execution-actions"><button type="button" :disabled="appState.saving || processing || !executable || timerBusy" @click="advance({},true)">Salta</button><button type="submit" class="primary" :disabled="appState.saving || processing || !executable || timerBusy">Completato</button></div><nav v-if="settings.arrows" class="exercise-arrows" aria-label="Sfoglia esercizi"><button type="button" aria-label="Esercizio precedente" :disabled="position===0 || appState.saving || processing" @click="move(-1)">←</button><span>{{ !executable ? 'Anteprima' : position===frontier && !session.terminata_at ? 'Corrente' : result.stato==='completato' ? 'Completato' : result.stato==='saltato' ? 'Saltato' : 'Iniziato' }} · {{ position+1 }} / {{ rows.length }}</span><button type="button" aria-label="Esercizio successivo" :disabled="position>=rows.length-1 || appState.saving || processing" @click="move(1)">→</button></nav><button v-if="position!==frontier && !settings.arrows" type="button" class="quiet full" @click="navigate('workout',{position:frontier})">Torna all’esercizio corrente</button></div></template>
  </ValuesForm>
  <dialog ref="dialog" class="execution-dialog" :aria-labelledby="panel ? 'execution-dialog-title' : undefined" @cancel.prevent="closePanel" @close="closedPanel" @click="event=>{if(event.target===dialog)closePanel()}">
    <template v-if="panel"><div class="row"><h2 id="execution-dialog-title">{{ titles[panel] }}</h2><button v-if="panel!=='futureReview'" autofocus aria-label="Chiudi dettagli" @click="closePanel">✕</button></div><p v-if="dialogError" class="dialog-error" role="alert">{{ dialogError }}</p>
      <ExecutionSettings v-if="panel==='settings'" @saved="dialog.close()" @cancel="dialog.close()" />
      <template v-else-if="panel==='future'"><p class="small">Proposta per questa voce del piano. Non cambia la sessione corrente; se la voce è condivisa vale negli allenamenti che la usano.</p><label class="check-row"><input v-model="futureReminder" type="checkbox" @change="appState.editorDirty=true" />Solo un promemoria per aumentare la difficoltà</label><template v-if="futureReminder"><button class="primary full" :disabled="appState.saving" @click="storeFuture()">Salva promemoria</button></template><ValuesForm v-else :key="'future-'+result.id" :category="details.exercise.categoria" :initial="details.entry.proposta_futura?.valori ?? measures(result,'effettivo')" action-label="Salva proposta" :disabled="appState.saving" @change="appState.editorDirty=true" @confirm="storeFuture" /><button class="quiet full" @click="cancelFuture">Annulla</button></template>
      <template v-else-if="panel==='futureReview'"><p v-if="futureProposal?.promemoria">L’ultima volta hai segnato di aumentare la difficoltà. Puoi applicare il promemoria e modificare ora i valori prima di iniziare.</p><template v-else><p>L’ultima volta hai preparato questi valori:</p><ul class="future-diff"><li v-for="change in futureDiff" :key="change.key"><strong>{{ change.label }}</strong><span>{{ change.before }} → {{ change.after }}</span></li></ul><p v-if="!futureDiff.length" class="small">La proposta mantiene gli stessi valori.</p></template><div class="future-actions"><button autofocus class="primary" :disabled="appState.saving" @click="resolveProposal('apply')">{{ futureProposal?.promemoria ? 'Modifica ora' : 'Applica' }}</button><button :disabled="appState.saving" @click="resolveProposal('later')">Rimanda</button><button class="quiet" :disabled="appState.saving" @click="resolveProposal('cancel')">Annulla proposta</button></div></template>
      <template v-else-if="panel==='cancel'"><p>La sessione e i suoi risultati scompariranno da calendario e progressi. L’operazione non può essere annullata.</p><div class="two-buttons"><button :disabled="processing" @click="closePanel">Mantieni</button><button class="danger-button" :disabled="processing || appState.syncing" @click="cancelCurrent">Annulla sessione</button></div></template>
      <template v-else-if="panel==='rest'"><p class="small">Minuti:secondi oppure secondi. 0 disattiva. I nuovi tempi valgono dal prossimo recupero.</p><form @submit.prevent="storeRest"><label>Tra le serie<input v-model="restDraft.serie" class="rest-setting" inputmode="numeric" placeholder="01:00" @input="appState.editorDirty=true" /></label><label>Dopo l’esercizio<input v-model="restDraft.esercizio" class="rest-setting" inputmode="numeric" placeholder="01:30" @input="appState.editorDirty=true" /></label><div class="two-buttons"><button type="button" @click="cancelRest">Annulla</button><button class="primary" type="submit" :disabled="appState.saving">Salva</button></div></form></template>
      <template v-else-if="panel==='mismatch'"><p>Hai contato <strong>{{ counted }}</strong> serie; nei valori sono indicate <strong>{{ pendingValues?.serie }}</strong>.</p><div class="count-choices"><button @click="resolveCount(true)">Usa {{ counted }} serie</button><button @click="resolveCount(false)">Mantieni {{ pendingValues?.serie }} serie</button></div></template>
      <template v-else-if="panel==='ai'"><h3>{{ details.exercise.nome }}</h3><p>{{ valuesText(measures(details.entry,'ai')) }}</p><p v-if="details.entry.ai_recupero_serie_secondi!=null">Recupero tra serie: {{ restText(details.entry.ai_recupero_serie_secondi) }}</p><p v-if="details.entry.ai_recupero_esercizio_secondi!=null">Dopo esercizio: {{ restText(details.entry.ai_recupero_esercizio_secondi) }}</p></template>
      <template v-else-if="panel==='equipment'"><p v-if="!equipment.length">Nessun attrezzo indicato.</p><ul v-else><li v-for="tool in equipment" :key="tool.id">{{ tool.nome }} · {{ tool.ruolo }} · {{ tool.available ? 'disponibile' : 'non presente nel tuo inventario' }}</li></ul></template>
      <template v-else-if="panel==='video'"><template v-if="safeVideo(details.exercise.video_url)"><p><a :href="safeVideo(details.exercise.video_url)" target="_blank" rel="noopener noreferrer">Apri video ↗</a></p><button v-if="!editingVideo && !details.exercise.deleted_at" @click="editingVideo=true">Modifica video</button></template><form v-if="(editingVideo || !safeVideo(details.exercise.video_url)) && !details.exercise.deleted_at" @submit.prevent="storeVideo"><label>Link video<input v-model="url" type="url" placeholder="https://…" @input="appState.editorDirty=true" /></label><div class="two-buttons"><button type="button" @click="cancelVideo">Annulla</button><button type="submit" class="primary" :disabled="appState.saving">Salva</button></div></form></template>
      <template v-else-if="panel==='history'"><p v-if="!history.length">Nessun risultato confermato precedente.</p><template v-else><ol class="past-results"><li v-for="past in historyView.rows" :key="past.id"><strong>{{ dateText(past.at,past.zone) }}</strong><p>{{ valuesText(measures(past,'effettivo')) }}</p></li></ol><div class="two-buttons"><button :disabled="historyView.page===0" @click="historyPage=historyView.page-1">← Più recenti</button><button :disabled="historyView.page>=historyView.count-1" @click="historyPage=historyView.page+1">Precedenti →</button></div><p class="small">Pagina {{ historyView.page+1 }} di {{ historyView.count }}</p></template></template>
    </template>
  </dialog>
</section>
<section v-else><h1>Sessione non disponibile</h1><button @click="navigate('home')">Torna alla Home</button></section>
</template>
