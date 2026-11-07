<script setup>
import { nextTick,onUnmounted,ref } from 'vue'
import { timerSounds,soundChoice,unlockAudio,playTimerSound,stopTimerSound } from '../platform/timer-sound.js'
const emit=defineEmits(['select'])
const dialog=ref(null),selected=ref('double'),error=ref(''),opener=ref(null)
let previousOverflow='',opened=false,previewGeneration=0
async function open(id){selected.value=soundChoice(id).id;error.value='';opener.value=document.activeElement;await nextTick();previousOverflow=document.body.style.overflow;dialog.value.showModal();document.body.style.overflow='hidden';opened=true}
function close(){previewGeneration++;stopTimerSound();dialog.value?.close()}
function closed(){if(opened){document.body.style.overflow=previousOverflow;opened=false;opener.value?.focus()}}
async function preview(id){selected.value=id;error.value='';const generation=++previewGeneration;const available=await unlockAudio();if(!opened || generation!==previewGeneration)return;if(!available || !playTimerSound(id))error.value='Audio non disponibile. Controlla volume e autorizzazioni del browser.'}
function select(){emit('select',selected.value);close()}
onUnmounted(()=>{close();closed()})
defineExpose({open})
</script>
<template>
<dialog ref="dialog" class="execution-dialog sound-picker" aria-labelledby="sound-picker-title" @cancel.prevent="close" @close="closed" @click="event=>{if(event.target===dialog)close()}">
 <div class="row"><h2 id="sound-picker-title">Scegli suono</h2><button autofocus type="button" aria-label="Chiudi scelta suono" @click="close">✕</button></div>
 <p class="small">Tocca un suono per ascoltarlo, poi premi Seleziona.</p>
 <div class="sound-options" role="group" aria-label="Suoni disponibili"><button v-for="sound in timerSounds" :key="sound.id" type="button" :aria-pressed="selected===sound.id" @click="preview(sound.id)"><span><strong>{{ sound.name }}</strong><small>{{ sound.description }}</small></span><span aria-hidden="true">{{ selected===sound.id ? '✓' : '▷' }}</span></button></div>
 <p v-if="error" role="alert" class="dialog-error">{{ error }}</p>
 <div class="two-buttons"><button type="button" @click="close">Annulla</button><button type="button" class="primary" @click="select">Seleziona</button></div>
</dialog>
</template>
