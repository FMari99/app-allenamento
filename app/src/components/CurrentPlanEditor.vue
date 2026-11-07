<script setup>
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { appState, saveCurrent } from '../state/app.js'
import { active, getRow, measures } from '../domain/session.js'
import ValuesForm from './ValuesForm.vue'
const props=defineProps({exerciseId:String})
const dialog=ref(null), selected=ref(null), opened=ref(false), error=ref('')
const entries=computed(()=>active(appState.snapshot.data.esercizi_allenamento).filter(e=>{
 const w=getRow(appState.snapshot.data,'allenamenti',e.allenamento_id),p=w && getRow(appState.snapshot.data,'schede',w.scheda_id)
 return e.esercizio_id===props.exerciseId && w && !w.deleted_at && p && !p.deleted_at
}))
const entry=computed(()=>entries.value.find(e=>e.id===selected.value) ?? entries.value[0])
const exercise=computed(()=>getRow(appState.snapshot.data,'esercizi',props.exerciseId))
let previousOverflow=''
function label(item){const w=getRow(appState.snapshot.data,'allenamenti',item.allenamento_id);return getRow(appState.snapshot.data,'schede',w.scheda_id).nome+' / '+w.nome}
async function open(){if(appState.editorDirty)return;opened.value=true;error.value='';await nextTick();previousOverflow=document.body.style.overflow;dialog.value.showModal();document.body.style.overflow='hidden'}
function close(){if(appState.editorDirty){error.value='Salva o annulla le modifiche prima di chiudere.';return}dialog.value.close()}
function closed(){opened.value=false;document.body.style.overflow=previousOverflow}
function cancel(){appState.editorDirty=false;dialog.value.close()}
function choose(id){if(appState.editorDirty){error.value='Salva o annulla la modifica prima di cambiare allenamento.';return}selected.value=id}
async function save(values){if(await saveCurrent(entry.value.id,values)){appState.editorDirty=false;dialog.value.close()}else error.value=appState.error}
onUnmounted(()=>{if(opened.value){dialog.value?.close();document.body.style.overflow=previousOverflow}})
</script>
<template>
<button v-if="entries.length" :disabled="appState.editorDirty" @click="open">Modifica piano corrente</button>
<dialog ref="dialog" class="execution-dialog" aria-labelledby="current-plan-title" @cancel.prevent="close" @close="closed" @click="event=>{if(event.target===dialog)close()}"><template v-if="opened && entry"><div class="row"><h2 id="current-plan-title">Piano corrente</h2><button aria-label="Chiudi piano corrente" @click="close">✕</button></div><p v-if="error" class="dialog-error" role="alert">{{ error }}</p><label v-if="entries.length>1">Scheda e allenamento<select :value="entry.id" :disabled="appState.editorDirty" @change="choose($event.target.value)"><option v-for="item in entries" :key="item.id" :value="item.id">{{ label(item) }}</option></select></label><p v-else>{{ label(entry) }}</p><ValuesForm :key="entry.id" :category="exercise.categoria" :initial="measures(entry,'corrente')" action-label="Salva impostazione" :disabled="appState.saving" @change="appState.editorDirty=true" @confirm="save"/><button @click="cancel">Annulla</button></template></dialog>
</template>
