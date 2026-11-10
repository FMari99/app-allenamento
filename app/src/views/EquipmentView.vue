<script setup>
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { appState, saveTool, deleteTool, saveToolAvailability } from '../state/app.js'
import { active } from '../domain/session.js'
const data=computed(()=>appState.snapshot.data)
const tools=computed(()=>[...active(data.value.strumenti)].sort((a,b)=>a.nome.localeCompare(b.nome,'it')))
const available=id=>active(data.value.attrezzatura_disponibile).some(row=>row.strumento_id===id)
const dialog=ref(null),mode=ref(null),tool=ref(null),name=ref(''),notes=ref(''),error=ref('')
let previousOverflow=''
const changed=computed(()=>mode.value==='add' ? Boolean(name.value || notes.value) : mode.value==='notes' ? notes.value!==(tool.value?.note ?? '') : name.value!==(tool.value?.nome ?? ''))
function dirty(){appState.editorDirty=changed.value}
async function open(kind,item=null){
  mode.value=kind;tool.value=item;name.value=item?.nome ?? '';notes.value=item?.note ?? '';error.value='';appState.editorDirty=false
  previousOverflow=document.body.style.overflow
  await nextTick();dialog.value.showModal();document.body.style.overflow='hidden'
}
function discard(){appState.editorDirty=false;dialog.value?.close()}
appState.discardEditor=discard
function close(){if(appState.saving)return;if(changed.value && !window.confirm('Scartare le modifiche non salvate?'))return;discard()}
function closed(){mode.value=null;appState.editorDirty=false;document.body.style.overflow=previousOverflow}
async function save(){
  const patch=mode.value==='notes' ? {note:notes.value} : mode.value==='rename' ? {nome:name.value} : {nome:name.value,note:notes.value}
  if(await saveTool(tool.value?.id ?? null,patch))discard();else error.value=appState.error
}
async function remove(item){if(window.confirm('Eliminare “'+item.nome+'”? Sparirà dall’attrezzatura e dalle indicazioni degli esercizi. Le schede e i risultati restano invariati.'))await deleteTool(item.id)}
async function changeAvailability(item,event){const input=event.target;if(!await saveToolAvailability(item.id,input.checked))input.checked=available(item.id)}
onUnmounted(()=>{if(appState.discardEditor===discard){appState.discardEditor=null;appState.editorDirty=false}if(mode.value)document.body.style.overflow=previousOverflow})
</script>
<template>
  <header class="page-intro"><span class="eyebrow">IL TUO ESSENZIALE</span><h1>Attrezzatura.</h1><p>Indica ciò che hai a disposizione per le prossime schede.</p><button class="primary" :disabled="appState.saving" @click="open('add')">Aggiungi strumento</button></header>
  <p class="small">Le modifiche confermate si salvano subito e si inviano automaticamente quando sei online. Le schede già create restano invariate.</p>
  <section v-if="tools.length" class="card equipment-list" aria-label="I tuoi strumenti">
    <article v-for="item in tools" :key="item.id" class="equipment-item">
      <label class="check-row"><input type="checkbox" :checked="available(item.id)" :disabled="appState.saving" @change="changeAvailability(item,$event)" /><span>{{ item.nome }}<small>{{ available(item.id) ? 'A disposizione' : 'Non disponibile per nuove schede' }}</small></span></label>
      <div class="equipment-item-actions"><button :disabled="appState.saving" @click="open('notes',item)">Note{{ item.note ? ' •' : '' }}</button><button class="quiet" :disabled="appState.saving" @click="open('rename',item)">Modifica nome</button><button class="quiet danger-text" :disabled="appState.saving" @click="remove(item)">Elimina</button></div>
    </article>
  </section>
  <dialog ref="dialog" class="equipment-dialog" aria-labelledby="equipment-dialog-title" @cancel.prevent="close" @close="closed" @click="event=>{if(event.target===dialog)close()}">
    <template v-if="mode"><div class="row"><h2 id="equipment-dialog-title">{{ mode==='add' ? 'Nuovo strumento' : mode==='notes' ? 'Note · '+tool.nome : 'Modifica nome' }}</h2><button type="button" aria-label="Chiudi" @click="close">✕</button></div>
    <form @submit.prevent="save"><label v-if="mode!=='notes'">Nome<input v-model="name" type="text" required autofocus @input="dirty" /></label>
      <label v-if="mode!=='rename'">Note facoltative<textarea v-model="notes" :autofocus="mode==='notes'" rows="10" placeholder="Pesi disponibili, regolazioni, dove si trova, vincoli pratici…" @input="dirty" /></label>
      <p v-if="mode==='add'" class="small">Il nuovo strumento sarà segnato come disponibile. Puoi cambiare la spunta in qualsiasi momento.</p>
      <p v-if="error" class="dialog-error" role="alert">{{ error }}</p><div class="two-buttons"><button type="button" :disabled="appState.saving" @click="close">Annulla</button><button type="submit" class="primary" :disabled="appState.saving || !changed">Salva</button></div>
    </form></template>
  </dialog>
</template>
