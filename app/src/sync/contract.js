export const automaticGroupKinds = new Set(['sessione_conclusa', 'sessione_annullata', 'inventario_confermato'])
export function canRetryAutomatically(group) {
  return automaticGroupKinds.has(group.kind) && group.authorized === true && group.status === 'pending'
}

// Stessa selezione dell'engine: nessun lavoro quando restano solo gruppi manuali o dipendenti.
export function nextSendableGroup(snapshot,manual=false,attempted=new Set()) {
 return snapshot.outbox.find(g=>g.status==='pending' && !attempted.has(g.operation_id)
  && (manual || canRetryAutomatically(g))
  && !(g.depends_on ?? []).some(op=>snapshot.outbox.some(other=>other.operation_id===op)))
}
