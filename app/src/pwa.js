import { appState } from './state/app.js'
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      appState.updateReady = Boolean(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) appState.updateReady = true
        })
      })
      navigator.serviceWorker.addEventListener('controllerchange', () => { appState.offlineReady = Boolean(navigator.serviceWorker.controller) })
      await navigator.serviceWorker.ready
      appState.offlineReady = Boolean(navigator.serviceWorker.controller)
    } catch {
      appState.offlineReady = false
    }
  })
}
