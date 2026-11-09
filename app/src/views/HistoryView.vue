<script setup>
import { computed } from 'vue'
import { appState, navigate } from '../state/app.js'
import { active, sessionStatus, progress, formatDuration, sessionRows, exerciseForResult, measures } from '../domain/session.js'
import { resumePosition } from '../domain/execution.js'
import { dateText, valuesText } from '../domain/presentation.js'
const data = computed(() => appState.snapshot.data)
const sessions = computed(() => [...active(data.value.sessioni)].sort((a, b) => b.iniziata_at.localeCompare(a.iniziata_at)))
</script>
<template>
  <header class="page-intro"><span class="eyebrow">OGNI PASSO CONTA</span><h1>Il tuo percorso.</h1><p>Sessioni e risultati salvati su questo dispositivo.</p></header>
  <section v-if="!sessions.length" class="card"><h2>Ancora nessuna sessione</h2><p>Inizia un allenamento: ritroverai qui anche quelli lasciati a metà.</p><button @click="navigate('home')">Vai alla Home</button></section>
  <section v-else aria-label="Storico delle sessioni"><article v-for="session in sessions" :key="session.id" class="card"><div class="row"><span class="pill">{{ sessionStatus(session, appState.now) }}</span><span class="small">{{ progress(data, session.id).percent }}% completato</span></div><h2>{{ session.allenamento_nome_snapshot }}</h2><p class="small">{{ session.scheda_nome_snapshot }} · revisione {{ session.scheda_revisione }}</p><p class="small">{{ dateText(session.iniziata_at, session.fuso_orario) }}<br />{{ formatDuration(session, appState.now) }}{{ session.terminata_at ? ' · comprende pause e recuperi' : '' }}</p>
    <details><summary>{{ progress(data, session.id).completed }} risultati confermati su {{ progress(data, session.id).total }}</summary><ol><li v-for="result in sessionRows(data, session.id)" :key="result.id"><strong>{{ exerciseForResult(data, result).exercise.nome }}</strong><p class="small">{{ result.stato === 'completato' ? valuesText(measures(result, 'effettivo')) : result.stato === 'saltato' ? 'Saltato · nessun risultato' : 'Bozza · non inclusa nei progressi' }}</p></li></ol></details>
    <button class="full" :disabled="appState.saving" @click="navigate(session.terminata_at ? 'review' : 'workout', { sessionId: session.id, position: resumePosition(data,session.id) })">{{ session.terminata_at ? 'Rivedi o correggi risultati' : 'Riprendi allenamento' }}</button>
  </article></section>
</template>
