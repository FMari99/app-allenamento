<script setup>
import { computed, ref, watch } from 'vue'
import { chartLayout,keepPointSelection } from '../domain/consultation.js'
import { dateText } from '../domain/presentation.js'
const props = defineProps({ points:Array, fields:Array, labels:Array, title:String, independent:Boolean })
const selected = ref(0)
watch(() => props.points, (points,previous) => { selected.value = keepPointSelection(points,previous,selected.value) }, { immediate:true })
const lines = computed(() => chartLayout(props.points, props.fields, props.independent))
const point = computed(() => props.points[selected.value])
const cursor = computed(() => lines.value[0]?.points[selected.value]?.x)
function select(event) {
  const svg = event.currentTarget, rect = svg.getBoundingClientRect(), x = (event.clientX-rect.left)/rect.width*320
  if (event.type === 'pointerdown') svg.setPointerCapture(event.pointerId)
  if (event.type === 'pointermove' && !svg.hasPointerCapture(event.pointerId)) return
  selected.value = lines.value[0].points.reduce((best,p) => Math.abs(p.x-x)<Math.abs(lines.value[0].points[best].x-x) ? p.index : best,0)
}
</script>
<template>
  <section class="card progress-chart"><h3>{{ title }}</h3><p v-if="!points.length" class="small">Nessun risultato confermato.</p><template v-else>
    <p v-if="independent" class="small">Scale indipendenti: l’altezza delle curve non confronta le unità. I valori originali sono riportati sotto.</p>
    <div class="chart-legend"><span v-for="(label,i) in labels" :key="label" :class="'curve-'+i">{{ label }} · scala 0–{{ lines[i].max }}</span></div>
    <svg viewBox="0 0 320 170" role="img" :aria-label="title + ': ' + points.length + ' esecuzioni. Usa il cursore sotto per leggere i valori.'" @pointerdown="select" @pointermove="select"><path d="M24 24 V144 H296" class="chart-axis"/><g v-for="(line,i) in lines" :key="line.field" :class="'curve-'+i"><polyline :points="line.points.map(p => `${p.x},${p.y}`).join(' ')"/><circle v-for="p in line.points" :key="p.index" :cx="p.x" :cy="p.y" r="3"/></g><line :x1="cursor" :x2="cursor" y1="16" y2="150" class="chart-cursor"/></svg>
    <label class="small">Seleziona esecuzione {{ selected + 1 }} di {{ points.length }}<input v-model.number="selected" type="range" min="0" :max="points.length-1" step="1" :aria-label="'Esecuzione per ' + title" /></label>
    <p class="small" aria-live="polite">{{ dateText(point.at,point.zone) }}<br /><span v-for="(field,i) in fields" :key="field">{{ labels[i] }}: {{ Number(point[field]).toLocaleString('it-IT',{maximumFractionDigits:3}) }}{{ i < fields.length-1 ? ' · ' : '' }}</span></p>
  </template></section>
</template>
