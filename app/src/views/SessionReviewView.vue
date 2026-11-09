<script setup>
import { computed, ref, onUnmounted, watch } from 'vue'
import { appState, back, saveReview } from '../state/app.js'
import { getRow, sessionRows, exerciseForResult, measures } from '../domain/session.js'
import { reviewDraft, reviewChanged } from '../domain/session-review.js'
import { dateText, valuesText } from '../domain/presentation.js'
import ValuesForm from '../components/ValuesForm.vue'
const data=computed(()=>appState.snapshot.data)
const session=computed(()=>getRow(data.value,'sessioni',appState.snapshot.ui.sessionId))
const rows=computed(()=>sessionRows(data.value,session.value?.id))
const editing=ref(false),draft=ref({}),token=ref(0),container=ref(null)
function reset(){editing.value=false;draft.value={};token.value++;appState.editorDirty=false}
appState.discardEditor=reset
onUnmounted(()=>{appState.discardEditor=null;appState.editorDirty=false})
watch(()=>session.value?.id,reset)
function edit(){draft.value=reviewDraft(data.value,session.value.id);editing.value=true;token.value++}
function change(id,values){draft.value[id]=values;appState.editorDirty=reviewChanged(data.value,session.value.id,draft.value)}
async function save(){
  for(const form of container.value.querySelectorAll('form'))if(!form.reportValidity())return
  if(await saveReview(session.value.id,draft.value))reset()
}
</script>
<template>
  <section v-if="session?.terminata_at" ref="container" class="session-review">
    <header class="page-intro"><span class="eyebrow">{{ editing ? 'CORREGGI I RISULTATI' : 'SESSIONE CONCLUSA' }}</span><h1>{{ session.allenamento_nome_snapshot }}</h1><p>{{ session.scheda_nome_snapshot }} · {{ dateText(session.iniziata_at,session.fuso_orario) }}</p></header>
    <div class="two-buttons review-actions"><button :disabled="appState.saving" @click="back">Chiudi</button><button v-if="!editing" class="primary" :disabled="appState.saving" @click="edit">Modifica</button><button v-else class="primary" :disabled="appState.saving || !appState.editorDirty" @click="save">Salva</button></div>
    <p v-if="editing" class="small" role="status">{{ appState.editorDirty ? 'Modifiche non salvate.' : 'Modifica i valori, poi premi Salva per salvare tutto l’allenamento.' }} Le correzioni salvate si inviano con Sincronizza.</p>
    <article v-for="(row,index) in rows" :key="row.id" class="card"><h2 class="review-exercise-title">{{ index+1 }}. {{ exerciseForResult(data,row).exercise.nome }}</h2>
      <p v-if="row.stato!=='completato'" class="small">{{ row.stato==='saltato' ? 'Saltato · nessun risultato' : 'Non confermato · nessun risultato' }}</p>
      <ValuesForm v-else-if="editing" :key="`${row.id}-${token}`" :category="exerciseForResult(data,row).exercise.categoria" :initial="draft[row.id]" :locked="appState.saving" @change="change(row.id,$event)" @confirm="save"><template #actions><span /></template></ValuesForm>
      <p v-else>{{ valuesText(measures(row,'effettivo')) }}</p>
    </article>
  </section>
  <section v-else><p>Sessione non disponibile.</p><button @click="back">Chiudi</button></section>
</template>
