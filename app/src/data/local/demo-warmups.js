const blockId='00000000-0000-0000-0000-0000000000b0'
// Aggiornamento della sola demo: nessuna alterazione delle sessioni già iniziate.
export function seedDemoWarmups(data) {
 const plan=data.schede.find(p=>!p.deleted_at && p.nome!=='Demo essenziale')
 if(!plan || data.allenamenti.some(w=>w.id===blockId))return false
 const workouts=data.allenamenti.filter(w=>w.scheda_id===plan.id && !w.deleted_at && w.tipo!=='riscaldamento')
 const source=data.esercizi_allenamento.find(e=>workouts.some(w=>w.id===e.allenamento_id))
 if(!source)return false
 const common={created_at:new Date().toISOString(),updated_at:new Date().toISOString(),row_version:0,deleted_at:null}
 data.allenamenti.push({...common,id:blockId,scheda_id:plan.id,nome:'Attivazione demo',note:'Blocco fittizio condiviso tra due allenamenti.',posizione:Math.max(0,...workouts.map(w=>w.posizione))+1,tipo:'riscaldamento'})
 data.esercizi_allenamento.push({...source,...common,id:'00000000-0000-0000-0000-0000000000b1',allenamento_id:blockId,posizione:1,ai_serie:1,corrente_serie:1,ai_ripetizioni:5,corrente_ripetizioni:5,note:'Riscaldamento dimostrativo, nessuna prescrizione personale.'})
 plan.revisione=(plan.revisione ?? 1)+1;plan.updated_at=common.updated_at
 for(const w of workouts.slice(0,2))w.riscaldamento_id=blockId
 return true
}
