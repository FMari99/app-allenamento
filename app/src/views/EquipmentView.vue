<script setup>
import { computed, ref } from 'vue'
import { appState, saveInventory } from '../state/app.js'
import { active } from '../domain/session.js'
const data = computed(() => appState.snapshot.data)
const tools = computed(() => active(data.value.strumenti))
const selected = ref(active(data.value.attrezzatura_disponibile).map(row => row.strumento_id))
const saved = ref(false)
async function save() { if (await saveInventory(selected.value)) { appState.editorDirty = false; saved.value = true } }
function cancel() { selected.value = active(data.value.attrezzatura_disponibile).map(row => row.strumento_id); appState.editorDirty = false }
</script>
<template>
  <header class="page-intro"><span class="eyebrow">IL TUO ESSENZIALE</span><h1>Attrezzatura.</h1><p>Seleziona gli strumenti a tua disposizione.</p></header>
  <section class="card"><h2>Cosa hai a disposizione?</h2><p v-if="!tools.length">Non ci sono strumenti nel catalogo locale. La demo ne include uno per provare questa schermata.</p><form v-else @submit.prevent="save"><label v-for="tool in tools" :key="tool.id" class="check-row"><input v-model="selected" type="checkbox" :value="tool.id" @change="appState.editorDirty = true; saved = false" /><span>{{ tool.nome }}</span></label><button class="primary full" type="submit" :disabled="appState.saving">Salva attrezzatura</button><button v-if="appState.editorDirty" type="button" class="quiet" @click="cancel">Annulla modifiche</button></form><p v-if="saved" role="status">Attrezzatura salvata sul dispositivo.</p><p class="small">Gli strumenti necessari e quelli facoltativi sono indicati nel dettaglio di ogni esercizio. Le eccezioni pratiche si concordano in conversazione quando si crea la scheda.</p></section>
</template>
