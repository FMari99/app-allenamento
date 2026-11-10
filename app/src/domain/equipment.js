import { active, getRow, setInventory } from './session.js'
import { enqueue } from '../sync/local-groups.js'

export function exerciseEquipment(data,exerciseId){
  return active(data.esercizi_strumenti).filter(a=>a.esercizio_id===exerciseId).flatMap(a=>{
    const tool=getRow(data,'strumenti',a.strumento_id)
    return tool && !tool.deleted_at ? [{...a,nome:tool.nome,note:tool.note ?? '',available:active(data.attrezzatura_disponibile).some(row=>row.strumento_id===tool.id)}] : []
  })
}
const queue=(snapshot,records)=>{
  if(records.length){
    const group=enqueue(snapshot,'inventory','inventario_confermato',true,records)
    // Anche nuovi ID devono attendere una rimozione precedente (nomi unici).
    group.depends_on=[...new Set([...group.depends_on,...snapshot.outbox.filter(g=>g!==group && (g.logical_id ?? g.id)==='inventory').map(g=>g.operation_id)])]
  }
  return records.length
}
export function writeTool(snapshot,id,patch,now=new Date().toISOString()){
  const existing=id && getRow(snapshot.data,'strumenti',id)
  if(id && (!existing || existing.deleted_at))throw new Error('Strumento non disponibile')
  const nome=(patch.nome ?? existing?.nome ?? '').trim(),note=patch.note ?? existing?.note ?? ''
  if(!nome)throw new Error('Inserisci il nome dello strumento')
  if(typeof note!=='string')throw new Error('Note non valide')
  if(active(snapshot.data.strumenti).some(t=>t.id!==id && t.nome.trim().toLocaleLowerCase('it-IT')===nome.toLocaleLowerCase('it-IT')))throw new Error('Esiste già uno strumento con questo nome')
  if(existing && existing.nome===nome && (existing.note ?? '')===note)return 0
  const tool=existing ?? {id:crypto.randomUUID(),created_at:now,updated_at:now,row_version:0,deleted_at:null}
  Object.assign(tool,{nome,note,updated_at:now})
  if(!existing)snapshot.data.strumenti.push(tool)
  const records=[{table:'strumenti',data:tool}]
  if(!existing){
    const selected=active(snapshot.data.attrezzatura_disponibile).map(row=>row.strumento_id)
    records.push(...setInventory(snapshot.data,[...selected,tool.id],now).map(data=>({table:'attrezzatura_disponibile',data})))
  }
  return queue(snapshot,records)
}
export function removeTool(snapshot,id,now=new Date().toISOString()){
  const tool=getRow(snapshot.data,'strumenti',id)
  if(!tool || tool.deleted_at)throw new Error('Strumento non disponibile')
  const records=[{table:'strumenti',data:tool},...['esercizi_strumenti','attrezzatura_disponibile'].flatMap(table=>active(snapshot.data[table]).filter(row=>row.strumento_id===id).map(data=>({table,data})))]
  for(const {data} of records)Object.assign(data,{deleted_at:now,updated_at:now})
  return queue(snapshot,records)
}
export function setToolAvailable(snapshot,id,available,now=new Date().toISOString()){
  if(!active(snapshot.data.strumenti).some(tool=>tool.id===id))throw new Error('Strumento non disponibile')
  const ids=new Set(active(snapshot.data.attrezzatura_disponibile).map(row=>row.strumento_id))
  if(available)ids.add(id);else ids.delete(id)
  return queue(snapshot,setInventory(snapshot.data,[...ids],now).map(data=>({table:'attrezzatura_disponibile',data})))
}
