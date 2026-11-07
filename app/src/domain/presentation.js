export const fieldLabels = { serie: 'Serie', ripetizioni: 'Ripetizioni per serie', carico_kg: 'Carico (kg)', durata_secondi: 'Durata (secondi)', distanza_metri: 'Distanza (metri)' }
export function valuesText(values) {
  return Object.entries(fieldLabels).filter(([key]) => values[key] != null).map(([key, label]) => `${label}: ${values[key]}`).join(' · ')
}
export const dateText = (value, zone) => new Intl.DateTimeFormat('it', { dateStyle: 'medium', timeStyle: 'short', timeZone: zone }).format(new Date(value))
export function safeVideo(url) {
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null } catch { return null }
}
