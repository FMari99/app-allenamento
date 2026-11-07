<script setup>
import { computed,onMounted,onUnmounted,ref,watch } from 'vue'
import { appState,continueActiveTimer,restartActiveTimer } from '../state/app.js'
import { getRow } from '../domain/session.js'
import { restText } from '../domain/rest.js'
import { timerScreen } from '../domain/timer-screen.js'
import { timerNext,timerNextDetails } from '../domain/training-timer.js'
const rest=computed(()=>appState.snapshot.local?.rest)
const session=computed(()=>rest.value && getRow(appState.snapshot.data,'sessioni',rest.value.sessionId))
const visible=computed(()=>appState.ready && appState.mode!=='login' && appState.snapshot.ui.page==='workout' && rest.value && session.value && !session.value.deleted_at && !session.value.terminata_at && appState.snapshot.ui.sessionId===session.value.id)
const dialog=ref(null),now=ref(Date.now()),busy=ref(false),error=ref(''),minimized=ref(false)
const state=computed(()=>timerScreen(rest.value,now.value))
const work=computed(()=>rest.value?.kind==='work'),preparing=computed(()=>rest.value?.kind==='prepare')
const title=computed(()=>preparing.value ? 'Preparati.' : work.value ? state.value.late ? 'Serie terminata.' : 'È il tuo momento.' : state.value.late ? 'Si riparte.' : 'Prendi fiato.')
const label=computed(()=>preparing.value ? 'PREPARAZIONE' : work.value ? 'ESERCIZIO' : rest.value?.kind==='serie' ? 'TRA LE SERIE' : 'TRA GLI ESERCIZI')
const next=computed(()=>timerNext(appState.snapshot))
const nextDetails=computed(()=>timerNextDetails(appState.snapshot))
const actionLabel=computed(()=>preparing.value ? 'Inizia ora' : work.value ? state.value.late ? 'Serie completata' : 'Interrompi serie' : state.value.late ? 'Riprendi allenamento' : 'Salta recupero')
const circumference=2*Math.PI*96
let ticker,previousOverflow='',opened=false
function close(){if(opened){dialog.value?.close();document.body.style.overflow=previousOverflow;opened=false}}
function show(){if(!opened){previousOverflow=document.body.style.overflow;dialog.value.showModal();document.body.style.overflow='hidden';opened=true}}
function sync(){if(visible.value && !minimized.value)show();else close()}
watch(()=>[Boolean(visible.value),minimized.value],sync,{flush:'post'})
watch(()=>rest.value?.id,()=>{now.value=Date.now();error.value='';if(!rest.value)minimized.value=false})
onMounted(()=>{ticker=setInterval(()=>{now.value=Date.now()},200);sync()})
onUnmounted(()=>{clearInterval(ticker);close()})
async function run(action){if(busy.value)return;busy.value=true;try{const id=rest.value?.id;if(!await action(id))error.value=appState.error}finally{busy.value=false}}
</script>
<template>
<div v-if="visible && minimized" :class="['timer-bar',{'timer-bar-late':state.late,'timer-bar-work':work || preparing}]" role="region" aria-label="Timer ridotto">
 <button type="button" class="timer-bar-expand" @click="minimized=false"><span>{{ label }} · {{ next }}</span><strong>{{ state.late ? '+' : '' }}{{ restText(state.late ? state.elapsed : state.remaining) }}</strong></button>
 <button type="button" :disabled="busy" aria-label="Ricomincia timer" @click="run(restartActiveTimer)">↻</button><button type="button" :disabled="busy" @click="run(continueActiveTimer)">{{ actionLabel }}</button>
 <p v-if="error" role="alert">{{ error }}</p>
</div>
<dialog ref="dialog" :class="['rest-screen',{'rest-screen-late':state.late,'rest-screen-work':!state.late && (work || preparing)}]" aria-labelledby="rest-screen-title" @cancel.prevent="minimized=true">
 <button class="timer-minimize" type="button" aria-label="Riduci timer e guarda gli esercizi" @click="minimized=true">↙ Riduci</button>
 <div class="rest-screen-content">
  <p class="rest-screen-eyebrow">{{ label }}</p><h1 id="rest-screen-title">{{ title }}</h1>
  <div class="rest-dial"><svg viewBox="0 0 224 224" aria-hidden="true"><circle class="rest-dial-track" cx="112" cy="112" r="96"/><circle class="rest-dial-progress" cx="112" cy="112" r="96" :stroke-dasharray="circumference" :stroke-dashoffset="circumference*(1-state.progress)"/></svg>
   <div class="rest-dial-value"><span class="rest-screen-label">{{ state.late ? 'Tempo oltre la scadenza' : preparing ? 'Inizio tra' : work ? 'Tempo della serie' : 'Recupero' }}</span><time role="timer">{{ state.late ? '+' : '' }}{{ restText(state.late ? state.elapsed : state.remaining) }}</time><span class="rest-screen-caption">{{ rest?.automatic && !preparing ? 'Sequenza automatica attiva' : preparing ? 'Posizionati con calma' : state.late ? 'Conferma quando sei pronto' : 'Puoi ridurre il timer' }}</span></div>
  </div>
  <div v-if="nextDetails" class="timer-next"><span v-if="nextDetails.label" class="timer-next-label">{{ nextDetails.label }}</span><strong>{{ nextDetails.name }}</strong><span v-if="nextDetails.preparation" class="timer-next-preparation">({{ nextDetails.preparation }})</span></div><p v-if="error" class="rest-screen-error" role="alert">{{ error }}</p>
  <button autofocus type="button" class="rest-screen-action" :disabled="busy || appState.saving" @click="run(continueActiveTimer)">{{ actionLabel }}</button>
  <button type="button" class="timer-restart" :disabled="busy || appState.saving" @click="run(restartActiveTimer)">↻ Ricomincia</button>
 </div>
</dialog>
</template>
