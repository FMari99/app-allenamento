import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { localPwa } from './tools/pwa-plugin.js'
export default defineConfig({ plugins: [vue(), localPwa()], base: './', envDir: '..' })
