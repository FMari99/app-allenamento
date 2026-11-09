<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { version } from '../../package.json'
import { appState, initialize, navigate, loadDemoHistory, act, tickActiveTimer } from './state/app.js'
import { executionSettings } from './domain/execution.js'
import { canTickTimer } from './domain/training-timer.js'
import { restRemaining } from './domain/rest.js'
import { unlockAudio,playTimerSound,shouldAnnounceRest } from './platform/timer-sound.js'
import RestTimer from './components/RestTimer.vue'
import SettingsView from './views/SettingsView.vue'
import AccountPanel from './components/AccountPanel.vue'
import HomeView from './views/HomeView.vue'
import WorkoutView from './views/WorkoutView.vue'
import SessionReviewView from './views/SessionReviewView.vue'
import HistoryView from './views/HistoryView.vue'
import CalendarView from './views/CalendarView.vue'
import ExerciseView from './views/ExerciseView.vue'
import EquipmentView from './views/EquipmentView.vue'
const menu = ref(null), menuOpen = ref(false)
let previousOverflow = ''
const settings=computed(()=>executionSettings(appState.snapshot))
const immersive=computed(()=>appState.mode!=='login' && appState.snapshot.ui.page==='workout' && settings.value.immersive)
let soundInterval,previousRest,timerTickBusy=false
function primeSound(){if(settings.value.sound)void unlockAudio()}
function checkSound(){
 const rest=appState.snapshot.local?.rest,now=Date.now(),visible=document.visibilityState==='visible'
 if(rest?.kind!=='prepare' && shouldAnnounceRest(previousRest,rest,now,settings.value.sound,visible,appState.snapshot.local?.notifiedRestId)){
  if(playTimerSound(settings.value.soundId))void act(s=>{(s.local ??= {}).notifiedRestId=rest.id},{background:true})
 }
 if(visible && appState.snapshot.ui.page==='workout' && !appState.editorDirty && !timerTickBusy && canTickTimer(rest,now)){timerTickBusy=true;void tickActiveTimer(rest.id).finally(()=>{timerTickBusy=false})}
 previousRest=visible && rest ? {id:rest.id,remaining:restRemaining(rest,now)} : null
}
onMounted(()=>{void initialize();soundInterval=setInterval(checkSound,300);document.addEventListener('pointerdown',primeSound);document.addEventListener('keydown',primeSound)})
function openMenu() {
  previousOverflow = document.body.style.overflow
  menu.value.showModal()
  menuOpen.value = true
  document.body.style.overflow = 'hidden'
}
function closedMenu() {
  menuOpen.value = false
  document.body.style.overflow = previousOverflow
}
function closeMenu() { menu.value?.close() }
async function go(page) {
  if (await navigate(page)) { closeMenu(); window.scrollTo(0, 0) }
}
watch(() => appState.mode, () => { if (menuOpen.value) closeMenu() })
onUnmounted(() => {clearInterval(soundInterval);document.removeEventListener('pointerdown',primeSound);document.removeEventListener('keydown',primeSound); if (menuOpen.value) document.body.style.overflow = previousOverflow })
</script>
<template>
  <div :class="['app-shell',{'immersive-shell':immersive}]">
    <div v-if="appState.error" class="error" role="alert">{{ appState.error }}</div>
    <main v-if="appState.ready" :class="{ 'execution-main': appState.mode !== 'login' && appState.snapshot.ui.page === 'workout' }">
      <AccountPanel v-if="appState.mode === 'login'" />
      <template v-else>
        <HomeView v-if="appState.snapshot.ui.page === 'home'" />
        <WorkoutView v-else-if="appState.snapshot.ui.page === 'workout'" />
        <SessionReviewView v-else-if="appState.snapshot.ui.page === 'review'" />
        <CalendarView v-else-if="appState.snapshot.ui.page === 'calendar'" />
        <ExerciseView v-else-if="appState.snapshot.ui.page === 'progress'" />
        <HistoryView v-else-if="appState.snapshot.ui.page === 'history'" />
        <SettingsView v-else-if="appState.snapshot.ui.page === 'settings'" />
        <EquipmentView v-else-if="appState.snapshot.ui.page === 'equipment'" />
        <template v-else-if="appState.snapshot.ui.page === 'account'">
          <header class="page-intro"><h1>Area personale.</h1></header>
          <AccountPanel />
          <aside v-if="appState.mode === 'demo'" class="demo-notice"><strong>Demo locale</strong> · Dati fittizi, separati dal tuo account. Nessun invio online.</aside>
          <section v-if="appState.mode === 'demo' && appState.snapshot.data.schede.length && !appState.snapshot.sync?.demoHistoryLoaded" class="card"><h2>Prova calendario e grafici</h2><p>Aggiungi cinque sessioni fittizie, inclusa una incompleta. Restano solo nella demo.</p><button :disabled="appState.saving" @click="loadDemoHistory">Aggiungi storico demo</button></section>
          <p class="small" role="status">{{ appState.saving ? 'Salvataggio…' : 'Archivio locale pronto' }} · {{ appState.snapshot.outbox.length }} gruppi in attesa</p>
          <p class="small">{{ appState.offline ? 'Connessione assente.' : 'Connessione disponibile.' }} {{ appState.offlineReady ? 'App pronta per la riapertura offline.' : 'La riapertura offline richiede il primo caricamento completo dell’app.' }}</p>
          <aside v-if="appState.updateReady" class="demo-notice">È pronta una nuova versione. Termina il salvataggio e chiudi tutte le finestre dell’app per aggiornarla alla riapertura.</aside>
        </template>
      </template>
    </main>
    <main v-else><h1>Prepariamo il tuo spazio.</h1><p>{{ appState.error ? 'Il salvataggio non è disponibile. Ricarica dopo aver risolto il problema.' : 'Apertura dell’archivio locale…' }}</p></main>
    <nav v-if="appState.ready && appState.mode !== 'login' && !immersive" class="bottom-nav" aria-label="Navigazione principale">
      <button :aria-current="appState.snapshot.ui.page === 'home' ? 'page' : undefined" :disabled="appState.saving" @click="go('home')"><span aria-hidden="true">⌂</span>Home</button>
      <button :aria-current="['calendar','history'].includes(appState.snapshot.ui.page) ? 'page' : undefined" :disabled="appState.saving" @click="go('calendar')"><span aria-hidden="true">◷</span>Calendario</button>
      <button :aria-expanded="menuOpen" aria-haspopup="dialog" aria-controls="side-menu" @click="openMenu"><span aria-hidden="true">☰</span>Menu</button>
    </nav>
    <RestTimer />
    <div v-if="appState.toast" class="bottom-toast" role="status">{{ appState.toast }}</div>
    <dialog id="side-menu" ref="menu" class="side-menu" aria-labelledby="menu-title" @close="closedMenu" @click="event => { if (event.target === menu) closeMenu() }">
      <div class="row"><h2 id="menu-title">Menu</h2><button autofocus aria-label="Chiudi menu" @click="closeMenu">✕</button></div>
      <nav aria-label="Altre pagine"><button v-for="item in [{id:'account',label:'Area personale'},{id:'progress',label:'Progressi'},{id:'equipment',label:'Attrezzatura'},{id:'settings',label:'Impostazioni'}]" :key="item.id" :aria-current="appState.snapshot.ui.page === item.id ? 'page' : undefined" :disabled="appState.saving" @click="go(item.id)">{{ item.label }}</button></nav>
      <hr /><p class="small">Versione: {{ version }}</p>
    </dialog>
  </div>
</template>
