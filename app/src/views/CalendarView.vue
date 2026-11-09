<script setup>
import { computed, ref } from 'vue'
import { appState, navigate } from '../state/app.js'
import { active, dayInZone, sessionStatus, formatDuration, progress } from '../domain/session.js'
import { monthDays, durationPoints } from '../domain/consultation.js'
import { resumePosition } from '../domain/execution.js'
import { dateText } from '../domain/presentation.js'
import ProgressChart from '../components/ProgressChart.vue'
const today = () => dayInZone(appState.now,Intl.DateTimeFormat().resolvedOptions().timeZone)
const month = computed(()=>appState.snapshot.ui.month ?? today().slice(0,7)), day = computed(()=>appState.snapshot.ui.day ?? today())
const data = computed(() => appState.snapshot.data)
const days = computed(() => monthDays(month.value))
const byDay = computed(() => {
 const map=new Map()
 for(const session of active(data.value.sessioni)){const key=dayInZone(session.iniziata_at,session.fuso_orario);map.set(key,[...(map.get(key) ?? []),session])}
 return map
})
const sessions = computed(() => [...(byDay.value.get(day.value) ?? [])].sort((a,b)=>a.iniziata_at.localeCompare(b.iniziata_at)))
const groups = computed(() => [...new Map([...active(data.value.sessioni)].filter(s=>s.terminata_at).sort((a,b)=>b.iniziata_at.localeCompare(a.iniziata_at)).map(s => [s.allenamento_id,{ id:s.allenamento_id, workout:s.allenamento_id, label:s.allenamento_nome_snapshot }])).values()])
const group = ref('')
const selectedGroup = computed(() => groups.value.find(g => g.id === group.value) ?? groups.value.find(g=>g.id===sessions.value.at(-1)?.allenamento_id) ?? groups.value[0])
const duration = computed(() => selectedGroup.value ? durationPoints(data.value,selectedGroup.value.workout) : [])
function changeMonth(delta) { const [y,m]=month.value.split('-').map(Number); void navigate('calendar',{month:new Date(Date.UTC(y,m-1+delta,1)).toISOString().slice(0,7)}) }
function choose(value) { group.value='';void navigate('calendar',{day:value,month:value.slice(0,7)}) }
const monthTitle = computed(() => new Date(month.value+'-01T12:00:00Z').toLocaleDateString('it-IT',{month:'long',year:'numeric',timeZone:'UTC'}))

</script>
<template>
<header class="page-intro"><span class="eyebrow">IL TUO PERCORSO</span><h1>Calendario.</h1><button @click="navigate('history')">Tutto lo storico</button></header>
<section class="card"><div class="calendar-heading"><button class="month-arrow" aria-label="Mese precedente" @click="changeMonth(-1)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button><h2>{{ monthTitle }}</h2><button class="month-arrow" aria-label="Mese successivo" @click="changeMonth(1)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button></div><button class="quiet" @click="choose(today())">Oggi</button><div class="calendar-grid"><span v-for="name in ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']" :key="name" class="small">{{ name }}</span><button v-for="cell in days" :key="cell.day" :class="{ muted:!cell.current, selected:cell.day===day, recorded:(byDay.get(cell.day)?.length ?? 0) }" :aria-label="cell.day + ': ' + (byDay.get(cell.day)?.length ?? 0) + ' sessioni'" :aria-pressed="cell.day===day" @click="choose(cell.day)">{{ cell.number }}<span v-if="(byDay.get(cell.day)?.length ?? 0)" aria-hidden="true">•</span></button></div><p class="small">• Giorno con sessioni. La data segue il fuso salvato all’avvio dell’allenamento.</p></section>
<h2>{{ day.split('-').reverse().join('/') }}</h2><p v-if="!sessions.length">Nessun allenamento registrato.</p><article v-for="session in sessions" :key="session.id" class="card"><span class="pill">{{ sessionStatus(session,appState.now) }}</span><h3>{{ session.allenamento_nome_snapshot }}</h3><p>{{ session.scheda_nome_snapshot }}</p><p class="small">{{ dateText(session.iniziata_at,session.fuso_orario) }} → {{ session.terminata_at ? dateText(session.terminata_at,session.fuso_orario) : 'nessuna fine' }}<br />{{ formatDuration(session,appState.now) }} · {{ progress(data,session.id).percent }}% completato</p><button @click="navigate(session.terminata_at ? 'review' : 'workout',{sessionId:session.id,position:resumePosition(data,session.id)})">{{ session.terminata_at ? 'Sessione ed esercizi' : 'Riprendi sessione' }}</button></article>
<section v-if="groups.length"><h2>Durate confrontabili</h2><label>Allenamento<select :value="selectedGroup?.id" @change="group=$event.target.value"><option v-for="item in groups" :key="item.id" :value="item.id">{{ item.label }}</option></select></label><p class="small">Sessioni concluse dello stesso allenamento, anche di revisioni diverse: il contenuto può essere cambiato. Pause e tempo con app chiusa sono inclusi.</p><ProgressChart :points="duration" :fields="['minuti']" :labels="['Durata (min)']" :title="selectedGroup.label" :show-scale="false" :fraction-digits="0" /></section>
</template>
