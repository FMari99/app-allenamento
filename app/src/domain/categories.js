export const categories = {
  ripetizioni: { label: 'Ripetizioni', fields: ['serie', 'ripetizioni'] },
  ripetizioni_carico: { label: 'Ripetizioni con carico', fields: ['serie', 'ripetizioni', 'carico_kg'] },
  durata: { label: 'Durata', fields: ['serie', 'durata_secondi'] },
  durata_carico: { label: 'Durata con carico', fields: ['serie', 'durata_secondi', 'carico_kg'] },
  distanza_durata: { label: 'Distanza e durata', fields: ['distanza_metri', 'durata_secondi'] },
}
export function validateValues(category, values, { partial = false } = {}) {
  const fields = categories[category]?.fields
  if (!fields) throw new Error('Categoria sconosciuta')
  for (const [key, value] of Object.entries(values)) {
    if (value == null) continue
    if (!fields.includes(key) || typeof value !== 'number' || !Number.isFinite(value) ||
        (key === 'carico_kg' ? value < 0 : value <= 0) ||
        (['serie', 'ripetizioni', 'durata_secondi'].includes(key) && !Number.isInteger(value))) {
      throw new Error(`Valore non valido: ${key}`)
    }
  }
  if (!partial && fields.some(key => values[key] == null)) throw new Error('Valori obbligatori mancanti')
  return true
}
