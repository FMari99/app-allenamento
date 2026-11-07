<script setup>
import { computed, ref, watch } from 'vue'
import { appState, navigate, saveVideo } from '../state/app.js'
import { active, getRow, measures } from '../domain/session.js'
import { exercisePoints } from '../domain/consultation.js'
import { dateText, valuesText, safeVideo } from '../domain/presentation.js'
import CurrentPlanEditor from '../components/CurrentPlanEditor.vue'
import ProgressChart from '../components/ProgressChart.vue'
const data = computed(() => appState.snapshot.data)
const exercise = computed(() => getRow(data.value,'esercizi',appState.snapshot.ui.exerciseId))
const catalog = computed(() => active(data.value.esercizi).sort((a,b) => a.nome.localeCompare(b.nome)))
const points = computed(() => exercise.value ? exercisePoints(data.value,exercise.value.id).map(p => ({ ...p, prodotto:p.effettivo_serie*p.effettivo_ripetizioni })) : [])
const overlay = ref(false), url = ref('')
watch(() => [exercise.value?.id,exercise.value?.video_url], () => { if (!appState.editorDirty) url.value=exercise.value?.video_url ?? '' }, {immediate:true})
function cancel() { url.value=exercise.value.video_url ?? ''; appState.editorDirty=false }
async function save() { if (await saveVideo(exercise.value.id,url.value)) { appState.editorDirty=false;url.value=exercise.value.video_url ?? '' } }
</script>
<template>
<header class="page-intro"><span class="eyebrow">ESERCIZI E PROGRESSI</span><h1>{{ exercise ? exercise.nome : 'I tuoi progressi.' }}</h1></header>
<template v-if="exercise"><button @click="navigate('progress',{exerciseId:null})">← Tutti gli esercizi</button><p>{{ exercise.istruzioni }}</p><section class="card"><h2>Video dell’esercizio</h2><a v-if="safeVideo(exercise.video_url)" :href="safeVideo(exercise.video_url)" target="_blank" rel="noopener noreferrer">Apri video ↗</a><p class="small">Un solo collegamento condiviso da tutte le schede. Il video richiede rete.</p><form v-if="!exercise.deleted_at" @submit.prevent="save"><label>Collegamento video (facoltativo)<input v-model="url" type="url" placeholder="https://…" @input="appState.editorDirty=true" /></label><button class="primary" :disabled="appState.saving">Salva video</button><button v-if="appState.editorDirty" type="button" @click="cancel">Annulla</button><p class="small">Per rimuoverlo, svuota il campo e salva. L’invio resta manuale con Sincronizza.</p></form></section>
<CurrentPlanEditor v-if="!exercise.deleted_at" :exercise-id="exercise.id" />
<h2>Risultati confermati</h2><p class="small">Ogni punto è un’esecuzione, anche nello stesso giorno e in schede diverse. Bozze e risultati saltati sono esclusi.</p><p v-if="!points.length">Ancora nessun risultato confermato.</p>
<template v-else><template v-if="points.some(p => p.effettivo_ripetizioni != null)"><button :aria-pressed="overlay" @click="overlay=!overlay">{{ overlay ? 'Mostra serie × ripetizioni' : 'Mostra serie e ripetizioni separate' }}</button><ProgressChart :points="points" :fields="overlay ? ['effettivo_serie','effettivo_ripetizioni'] : ['prodotto']" :labels="overlay ? ['Serie','Ripetizioni per serie'] : ['Serie × ripetizioni']" :independent="overlay" title="Serie e ripetizioni" /></template><ProgressChart v-if="points.some(p => p.effettivo_carico_kg != null)" :points="points" :fields="['effettivo_carico_kg']" :labels="['Carico (kg)']" title="Carico" /><ProgressChart v-if="points.some(p => p.effettivo_durata_secondi != null)" :points="points" :fields="['effettivo_durata_secondi']" :labels="['Durata (secondi)']" title="Durata" /><ProgressChart v-if="points.some(p => p.effettivo_distanza_metri != null)" :points="points" :fields="['effettivo_distanza_metri']" :labels="['Distanza (metri)']" title="Distanza" /><ol class="card"><li v-for="p in [...points].reverse()" :key="p.id"><strong>{{ dateText(p.at,p.zone) }}</strong><p class="small">{{ valuesText(measures(p,'effettivo')) }}</p><button @click="navigate('workout',{sessionId:p.sessione_id,position:0})">Apri sessione</button></li></ol></template></template>
<section v-else><p v-if="!catalog.length">Nessun esercizio scaricato. Scarica le schede da Menu → Area personale oppure apri la demo locale.</p><button v-for="item in catalog" :key="item.id" class="full exercise-link" @click="navigate('progress',{exerciseId:item.id})">{{ item.nome }} · ↗ progressi e video</button></section>
</template>
