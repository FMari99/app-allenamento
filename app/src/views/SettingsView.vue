<script setup>
import ExecutionSettings from '../components/ExecutionSettings.vue'
import { navigate,showToast } from '../state/app.js'
</script>
<template><section><header class="page-intro"><h1>Impostazioni</h1></header><ExecutionSettings @saved="showToast('Impostazioni salvate')" @cancel="navigate('home')" /></section></template>
