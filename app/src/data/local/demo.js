import { ensureExtraDemoPlan } from './extra-demo-plan.js'
import demo from '../../../../examples/scheda-demo.json'
import { emptyData, prefixed } from '../../domain/session.js'

export function demoData() {
  const data = emptyData()
  const common = { row_version: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null }
  data.schede.push({ ...common, id: demo.scheda.id, nome: demo.scheda.nome, note: demo.scheda.note, revisione: 1 })
  data.esercizi = demo.esercizi.map(({ strumenti, ...exercise }) => ({ ...common, ...exercise }))
  for (const [index, workout] of demo.scheda.allenamenti.entries()) {
    data.allenamenti.push({ ...common, id: workout.id, scheda_id: demo.scheda.id, nome: workout.nome, note: workout.note, posizione: index + 1 })
    data.esercizi_allenamento.push(...workout.esercizi.map((entry, i) => ({ ...common, id: entry.id, allenamento_id: workout.id, esercizio_id: entry.esercizio_id, posizione: i + 1, note: entry.note,
      ai_recupero_serie_secondi:entry.recuperi.tra_serie_secondi,ai_recupero_esercizio_secondi:entry.recuperi.dopo_esercizio_secondi,corrente_recupero_serie_secondi:entry.recuperi.tra_serie_secondi,corrente_recupero_esercizio_secondi:entry.recuperi.dopo_esercizio_secondi,
      ...prefixed(entry.valori, 'ai'), ...prefixed(entry.valori, 'corrente') })))
  }
  const secondId = '00000000-0000-0000-0000-000000000070'
  data.allenamenti.push({ ...common, id: secondId, scheda_id: demo.scheda.id, nome: 'Richiamo di prova', note: 'Secondo allenamento per provare la rotazione.', posizione: 2 })
  data.esercizi_allenamento.push(...data.esercizi_allenamento.slice(0, 2).map((entry, index) => ({ ...entry, id: `00000000-0000-0000-0000-00000000007${index + 1}`, allenamento_id: secondId })))
  const toolId = '00000000-0000-0000-0000-000000000080'
  data.strumenti.push({ ...common, id: toolId, nome: 'Manubri dimostrativi' })
  data.esercizi_strumenti.push({ ...common, id: '00000000-0000-0000-0000-000000000081', esercizio_id: demo.esercizi[1].id, strumento_id: toolId, ruolo: 'necessario' })
  ensureExtraDemoPlan(data)
  return data
}
