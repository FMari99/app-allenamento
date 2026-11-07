import { startSession,sessionRows,editResult,finishSession,measures } from '../../domain/session.js'
// Solo dati fittizi, richiamati esplicitamente nell'archivio demo separato.
export function seedDemoHistory(data, now = new Date()) {
  const workout = data.allenamenti.find(w => !w.deleted_at)
  if (!workout) throw new Error('Carica prima la demo locale')
  const ids=[]
  for (const [index,days] of [21,14,7,2,1].entries()) {
    const start=new Date(new Date(now).getTime()-days*86400000).toISOString()
    const id=startSession(data,workout.id,{now:start});ids.push(id)
    sessionRows(data,id).forEach((row,position) => {
      if (index===4 && position>0) return
      const values=measures(row,'effettivo')
      if(values.ripetizioni!=null) values.ripetizioni+=index
      if(values.carico_kg!=null) values.carico_kg+=index*2
      if(values.durata_secondi!=null) values.durata_secondi+=index*5
      editResult(data,row.id,values,{confirm:true,now:new Date(Date.parse(start)+position*60000).toISOString()})
    })
    if(index<4) finishSession(data,id,new Date(Date.parse(start)+(30+index*5)*60000).toISOString())
  }
  return ids
}
