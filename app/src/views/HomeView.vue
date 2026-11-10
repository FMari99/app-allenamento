<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { appState, loadDemo, navigate, begin, finishPartial } from '../state/app.js'
import { active, ordered, sessionStatus, progress, getRow, workoutEntries } from '../domain/session.js'
import { recentPlans, planSessions, sessionActivity, homeWorkout, openWorkoutSession, lastConfirmedAt } from '../domain/home.js'
import { resumePosition } from '../domain/execution.js'
import { dateText } from '../domain/presentation.js'
import { exerciseEquipment } from '../domain/equipment.js'
const data = computed(() => appState.snapshot.data)
const plans = computed(() => recentPlans(data.value))
const chosenPlanId=ref(null), chosenWorkoutId=ref(null)
const selectedPlan = computed(() => plans.value.find(p => p.id===chosenPlanId.value) ?? plans.value[0])
const workouts = computed(() => ordered(active(data.value.allenamenti).filter(w => w.scheda_id === selectedPlan.value?.id && w.tipo !== 'riscaldamento')))
const suggested = computed(() => homeWorkout(data.value,selectedPlan.value?.id))
const workout = computed(() => workouts.value.find(w=>w.id===chosenWorkoutId.value) ?? suggested.value)
const position = computed(() => workouts.value.findIndex(w=>w.id===workout.value?.id))
const session = computed(() => openWorkoutSession(data.value,workout.value?.id))
const lastAt = computed(() => session.value && lastConfirmedAt(data.value,session.value.id))
const current = computed(() => active(data.value.sessioni).find(s=>sessionStatus(s,appState.now)==='in corso'))
const planPicker=ref(null), pickerOpen=ref(false)
let previousOverflow=''
function openPicker(){ previousOverflow=document.body.style.overflow;planPicker.value.showModal();pickerOpen.value=true;document.body.style.overflow='hidden' }
function closePicker(){planPicker.value?.close()}
function pickerClosed(){pickerOpen.value=false;document.body.style.overflow=previousOverflow}
onUnmounted(()=>{if(pickerOpen.value){closePicker();document.body.style.overflow=previousOverflow}})
watch(()=>selectedPlan.value?.id,()=>{chosenWorkoutId.value=null})
function choosePlan(id){chosenPlanId.value=id;chosenWorkoutId.value=null;closePicker()}
function move(delta){chosenWorkoutId.value=workouts.value[(position.value+delta+workouts.value.length)%workouts.value.length].id}
function lastUse(plan){const last=planSessions(data.value,plan.id)[0];return last ? dateText(new Date(sessionActivity(data.value,last)).toISOString(),last.fuso_orario) : 'Non ancora eseguita'}
function toolSummary(entry) {
  return exerciseEquipment(data.value,entry.esercizio_id).map(a => `${a.nome} (${a.ruolo})`).join(' · ')
}
function resume(){if(session.value)return navigate('workout',{sessionId:session.value.id,position:resumePosition(data.value,session.value.id)})}
async function terminate(){
  const pending=session.value
  if(!pending)return
  const next=workouts.value[(position.value+1)%workouts.value.length]?.id
  if(await finishPartial(pending.id)){await nextTick();chosenWorkoutId.value=next}
}
</script>
<template>
  <section v-if="!plans.length && appState.mode === 'demo'" class="card empty"><h2>Il tuo spazio è pronto</h2><p>Puoi provare un allenamento dimostrativo salvato solo su questo dispositivo.</p><button class="primary" :disabled="appState.saving" @click="loadDemo">Prova la demo locale</button><p class="small">Torna al login per usare le tue schede reali.</p></section>
  <section v-else-if="!plans.length" class="card empty"><h2>Nessuna scheda scaricata</h2><p>Apri Menu → Area personale e premi «Scarica le tue schede». Le schede vengono create e caricate dall’assistente sul computer.</p></section>
  <section v-else aria-label="Scheda e allenamento selezionati" class="home-plan">
    <button class="plan-select" aria-haspopup="dialog" aria-controls="plan-picker" :aria-expanded="pickerOpen" @click="openPicker"><span><small>LA TUA SCHEDA</small><strong>{{ selectedPlan.nome }}</strong></span><span aria-hidden="true">⌄</span></button>
    <details v-if="selectedPlan.note" class="plan-notes"><summary>Note della scheda</summary><p class="small">{{ selectedPlan.note }}</p></details>
    <article v-if="workout" class="card workout-preview">
      <div class="workout-switcher"><button aria-label="Allenamento precedente" :disabled="workouts.length<2 || appState.saving" @click="move(-1)">←</button><span class="small">Allenamento {{ position+1 }} di {{ workouts.length }}</span><button aria-label="Allenamento successivo" :disabled="workouts.length<2 || appState.saving" @click="move(1)">→</button></div>
      <div class="row"><h2>{{ workout.nome }}</h2><span v-if="session" class="pill">{{ sessionStatus(session,appState.now) }}</span><span v-else-if="workout.id===suggested?.id" class="pill">Il prossimo per te</span></div>
      <div v-if="!session" class="start-workout-row"><button class="primary" :disabled="Boolean(current) || appState.saving" @click="begin(workout.id)">Inizia</button><p v-if="current" class="small">Hai una sessione in corso: riprendila dal suo allenamento oppure dal Calendario.</p></div>
      <p v-if="workout.riscaldamento_id" class="warmup-caption">Riscaldamento · {{ getRow(data,'allenamenti',workout.riscaldamento_id)?.nome }}</p>
      <p v-if="workout.note" class="small">{{ workout.note }}</p>
      <template v-if="session"><p class="small">{{ dateText(session.iniziata_at,session.fuso_orario) }} · {{ progress(data,session.id).percent }}% completato</p><div class="two-buttons"><button class="primary" :disabled="appState.saving" @click="resume">Riprendi</button><button :disabled="appState.saving || !lastAt" @click="terminate">Termina</button></div><p class="small">{{ lastAt ? 'Termina chiude all’ultimo esercizio confermato; le bozze restanti vengono segnate saltate.' : 'Conferma almeno un esercizio per poter terminare senza inventare un orario di fine.' }}</p></template>
      <details :key="workout.id" class="exercise-disclosure"><summary>Lista esercizi</summary>
      <ol class="exercise-list"><li v-for="entry in workoutEntries(data,workout.id)" :key="entry.id"><button class="quiet exercise-link" @click="navigate('progress',{exerciseId:entry.esercizio_id})"><small v-if="entry.allenamento_id!==workout.id" class="warmup-caption">Riscaldamento · </small>{{ getRow(data,'esercizi',entry.esercizio_id)?.nome }} ↗</button><small v-if="toolSummary(entry)" class="small tool-summary">{{ toolSummary(entry) }}</small></li></ol>
      </details>

    </article>
    <p v-else>Nessun allenamento disponibile per questa scheda.</p>
  </section>
  <dialog id="plan-picker" ref="planPicker" class="plan-picker" aria-labelledby="plan-picker-title" @close="pickerClosed" @click="event=>{if(event.target===planPicker)closePicker()}">
    <div class="row"><h2 id="plan-picker-title">Seleziona scheda</h2><button autofocus aria-label="Chiudi selezione scheda" @click="closePicker">✕</button></div><p class="small">Dalla più recente eseguita.</p>
    <button v-for="plan in plans" :key="plan.id" class="plan-option" :aria-pressed="selectedPlan?.id===plan.id" @click="choosePlan(plan.id)"><strong>{{ plan.nome }}</strong><small>{{ lastUse(plan) }}</small></button>
  </dialog>
</template>
