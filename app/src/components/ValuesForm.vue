<script setup>
import { reactive, useId, watch } from 'vue'
import { categories } from '../domain/categories.js'
const props=defineProps({category:String,initial:Object,title:String,actionLabel:String,disabled:Boolean,resetToken:Boolean,locked:Boolean})
const emit=defineEmits(['change','confirm']),formId=useId()
const values=reactive(Object.fromEntries(categories[props.category].fields.map(key=>[key,props.initial[key] ?? ''])))
watch(()=>props.resetToken,value=>{if(value)for(const key of Object.keys(values))values[key]=props.initial[key] ?? ''})
const clean=()=>Object.fromEntries(Object.entries(values).map(([key,value])=>[key,value==='' ? null : Number(value)]))
function input(key,event){values[key]=event.target.value;emit('change',clean())}
function label(key){return {serie:'Serie',ripetizioni:'Ripetizioni',carico_kg:'Carico',durata_secondi:props.category==='distanza_durata' ? 'Durata totale' : 'Durata per serie',distanza_metri:'Distanza'}[key]}
const units={carico_kg:'kg',durata_secondi:'s',distanza_metri:'m'}
const icons={serie:'M5 5h14M5 12h14M5 19h14',ripetizioni:'M19 7H8a4 4 0 0 0 0 8h1M5 17h11a4 4 0 0 0 0-8h-1M16 4l3 3-3 3M8 14l-3 3 3 3',carico_kg:'M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12',durata_secondi:'M9 2h6M12 2v3M12 9v5l3 2M20 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0',distanza_metri:'M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4'}
</script>
<template>
<form @submit.prevent="emit('confirm',clean())">
<fieldset :aria-label="title || 'Valori esercizio'"><legend v-if="title">{{ title }}</legend><div :class="['fields','metric-fields',{'paired-fields':categories[category].fields.includes('serie')}]">
<label v-for="key in categories[category].fields" :key="key" :class="['metric-field','metric-'+key,{'metric-wide':key==='carico_kg'}]" :for="`${formId}-${key}`"><span class="metric-label"><span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path :d="icons[key]" /></svg></span>{{ label(key) }}</span><span class="metric-input"><input :id="`${formId}-${key}`" :value="values[key]" type="number" :inputmode="['carico_kg','distanza_metri'].includes(key) ? 'decimal' : 'numeric'" :min="key==='carico_kg' ? 0 : key==='distanza_metri' ? 0.001 : 1" :step="['carico_kg','distanza_metri'].includes(key) ? '0.001' : '1'" :disabled="locked" required @input="input(key,$event)"/><span v-if="units[key]" class="metric-unit">{{ units[key] }}</span></span></label>
</div></fieldset>
<slot name="support" :values="clean()" />
<slot name="actions"><button v-if="actionLabel" type="submit" class="primary full" :disabled="disabled">{{ actionLabel }}</button></slot>
</form>
</template>
