<script setup>
import { computed, ref } from 'vue'
import { appState, navigate } from '../state/app.js'
import { active, dayInZone, sessionStatus, formatDuration, progress } from '../domain/session.js'
import { monthDays, durationPoints } from '../domain/consultation.js'
import { resumePosition } from '../domain/execution.js'
import { dateText } from '../domain/presentation.js'
import ProgressChart from '../components/ProgressChart.vue'
const today = () => dayInZone(appState.now,Intl.DateTimeFormat().resolvedOptions().timeZone)
const month = ref(appState.snapshot.ui.month ?? today().slice(0,7)), day = ref(appState.snapshot.ui.day ?? today())
const data = computed(() => appState.snapshot.data)
const days = computed(() => monthDays(month.value))
const byDay = computed(() => {
 const map=new Map()
 for(const session of active(data.value.sessioni)){const key=dayInZone(session.iniziata_at,session.fuso_orario);map.set(key,[...(map.get(key) ?? []),session])}
 return map
})
const sessions = computed(() => [...(byDay.value.get(day.value) ?? [])].sort((a,b)=>a.iniziata_at.localeCompare(b.iniziata_at)))
const groups = computed(() => [...new Map(active(data.value.sessioni).filter(s => s.terminata_at).map(s => [s.allenamento_id+':'+s.scheda_revisione,{ id:s.allenamento_id+':'+s.scheda_revisione, workout:s.allenamento_id, revision:s.scheda_revisione, label:s.allenamento_nome_snapshot+' · revisione '+s.scheda_revisione }])).values()])
const group = ref('')
const selectedGroup = computed(() => groups.value.find(g => g.id === group.value) ?? groups.value[0])
const duration = computed(() => selectedGroup.value ? durationPoints(data.value,selectedGroup.value.workout,selectedGroup.value.revision) : [])
function changeMonth(delta) { const [y,m]=month.value.split('-').map(Number); month.value = new Date(Date.UTC(y,m-1+delta,1)).toISOString().slice(0,7); void navigate('calendar',{month:month.value}) }
function choose(value) { day.value=value; month.value=value.slice(0,7); void navigate('calendar',{day:value,month:month.value}) }
const monthTitle = computed(() => new Date(month.value+'-01T12:00:00Z').toLocaleDateString('it-IT',{month:'long',year:'numeric',timeZone:'UTC'}))

</script>
<template>
<header class="page-intro"><span class="eyebrow">IL TUO PERCORSO</span><h1>Calendario.</h1><button @click="navigate('history')">Tutto lo storico</button></header>
<section class="card"><div class="row"><button aria-label="Mese precedente" @click="changeMonth(-1)">←</button><h2>{{ monthTitle }}</h2><button aria-label="Mese successivo" @click="changeMonth(1)">→</button></div><button class="quiet" @click="choose(today())">Oggi</button><div class="calendar-grid"><span v-for="name in ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']" :key="name" class="small">{{ name }}</span><button v-for="cell in days" :key="cell.day" :class="{ muted:!cell.current, selected:cell.day===day, recorded:(byDay.get(cell.day)?.length ?? 0) }" :aria-label="cell.day + ': ' + (byDay.get(cell.day)?.length ?? 0) + ' sessioni'" :aria-pressed="cell.day===day" @click="choose(cell.day)">{{ cell.number }}<span v-if="(byDay.get(cell.day)?.length ?? 0)" aria-hidden="true">•</span></button></div><p class="small">• Giorno con sessioni. La data segue il fuso salvato all’avvio dell’allenamento.</p></section>
<h2>{{ day.split('-').reverse().join('/') }}</h2><p v-if="!sessions.length">Nessun allenamento registrato.</p><article v-for="session in sessions" :key="session.id" class="card"><span class="pill">{{ sessionStatus(session,appState.now) }}</span><h3>{{ session.allenamento_nome_snapshot }}</h3><p>{{ session.scheda_nome_snapshot }}</p><p class="small">{{ dateText(session.iniziata_at,session.fuso_orario) }} → {{ session.terminata_at ? dateText(session.terminata_at,session.fuso_orario) : 'nessuna fine' }}<br />{{ formatDuration(session,appState.now) }} · {{ progress(data,session.id).percent }}% completato</p><button @click="navigate('workout',{sessionId:session.id,position:resumePosition(data,session.id)})">{{ session.terminata_at ? 'Sessione ed esercizi' : 'Riprendi sessione' }}</button></article>
<section v-if="groups.length"><h2>Durate confrontabili</h2><label>Allenamento e revisione<select :value="selectedGroup?.id" @change="group=$event.target.value"><option v-for="item in groups" :key="item.id" :value="item.id">{{ item.label }}</option></select></label><p class="small">Solo sessioni concluse dello stesso allenamento e revisione. Pause e tempo con app chiusa sono inclusi.</p><ProgressChart :points="duration" :fields="['minuti']" :labels="['Durata (min)']" :title="selectedGroup.label" /></section>
</template>
