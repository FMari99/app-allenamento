<script setup>
import { reactive,ref } from 'vue'
import { executionSettings } from '../domain/execution.js'
import { appState,saveExecutionSettings } from '../state/app.js'
import SoundPicker from './SoundPicker.vue'
import { unlockAudio,soundChoice } from '../platform/timer-sound.js'
const emit=defineEmits(['saved','cancel'])
const picker=ref(null)
function chooseSound(id){draft.soundId=id;appState.editorDirty=true}
const draft=reactive(executionSettings(appState.snapshot))
async function save(){if(draft.sound)void unlockAudio();if(await saveExecutionSettings(draft)){appState.editorDirty=false;emit('saved')}}
function cancel(){appState.editorDirty=false;emit('cancel')}
</script>
<template>
<form class="execution-settings" @submit.prevent="save">
<p class="small">Preferenze salvate su questo dispositivo.</p>
<label class="setting-toggle"><span><strong>Schermata intera</strong><small>Nascondi Home, Calendario e Menu durante l’esecuzione.</small></span><input v-model="draft.immersive" type="checkbox" role="switch" @change="appState.editorDirty=true" /></label>
<label class="setting-toggle"><span><strong>Frecce di navigazione</strong><small>Sfoglia gli esercizi senza avanzare la sessione.</small></span><input v-model="draft.arrows" type="checkbox" role="switch" @change="appState.editorDirty=true" /></label>
<label class="preparation-setting">Preparazione prima della serie <span><input v-model.number="draft.preparationSeconds" type="number" min="0" max="30" step="1" @input="appState.editorDirty=true" /> secondi</span></label>
<label class="setting-toggle"><span><strong>Suono a fine recupero</strong><small>Un segnale breve con l’app attiva. A schermo bloccato non è garantito.</small></span><input v-model="draft.sound" type="checkbox" role="switch" @change="appState.editorDirty=true; if(draft.sound)unlockAudio()" /></label>
<button v-if="draft.sound" type="button" class="sound-choice" @click="picker.open(draft.soundId)"><span>Scegli suono <strong>{{ soundChoice(draft.soundId).name }}</strong></span><span aria-hidden="true">♪ →</span></button>
<div class="two-buttons"><button type="button" @click="cancel">Annulla</button><button type="submit" class="primary" :disabled="appState.saving">Salva</button></div>
</form>
<SoundPicker ref="picker" @select="chooseSound" />
</template>
