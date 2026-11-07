import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyData } from '../app/src/domain/session.js'
import { monthDays,sessionsOnDay,exercisePoints,durationPoints,chartLayout,setVideo } from '../app/src/domain/consultation.js'
import { enqueue } from '../app/src/sync/local-groups.js'
const fixture = () => ({ ...emptyData(), esercizi:[{id:'e',video_url:null}], esercizi_allenamento:[{id:'old',esercizio_id:'e',deleted_at:'2026-01-01'},{id:'new',esercizio_id:'e'}], sessioni:[{id:'s',allenamento_id:'w',scheda_revisione:1,iniziata_at:'2026-10-28T23:30:00Z',terminata_at:'2026-10-29T00:30:00Z',fuso_orario:'Europe/Rome'},{id:'s2',allenamento_id:'w',scheda_revisione:2,iniziata_at:'2026-10-29T10:00:00Z',terminata_at:null,fuso_orario:'Europe/Rome'}] })
test('calendario lunedì-domenica, febbraio bisestile e fuso sessione', () => {
 const days=monthDays('2024-02');assert.equal(days.length,42);assert.equal(days[0].day,'2024-01-29');assert.equal(days.filter(d=>d.current).length,29)
 const data=fixture();assert.equal(sessionsOnDay(data,'2026-10-28').length,0);assert.equal(sessionsOnDay(data,'2026-10-29').length,2)
 data.sessioni[0].deleted_at='oggi';assert.equal(sessionsOnDay(data,'2026-10-29').length,1)
})
test('storico per ID stabile attraverso voci e schede, esecuzioni stesso istante distinte, bozze escluse', () => {
 const data=fixture(); const base={sessione_id:'s',esercizio_allenamento_id:'old',stato:'completato',completato_at:'2026-10-29T00:00:00Z',effettivo_serie:3,effettivo_ripetizioni:8}
 data.esercizi_sessione=[{...base,id:'a'},{...base,id:'b',esercizio_allenamento_id:'new'},{...base,id:'c',stato:'da_eseguire'},{...base,id:'d',stato:'saltato'},{...base,id:'x',deleted_at:'oggi'}]
 assert.deepEqual(exercisePoints(data,'e').map(p=>p.id),['a','b'])
 data.sessioni[0].deleted_at='oggi';assert.equal(exercisePoints(data,'e').length,0)
})
test('durate confrontabili non mischiano revisioni o incomplete e comprendono pause', () => {
 const data=fixture();assert.equal(durationPoints(data,'w',1)[0].minuti,60);assert.equal(durationPoints(data,'w',2).length,0)
 data.sessioni.push({...data.sessioni[0],id:'other',allenamento_id:'altro'});assert.equal(durationPoints(data,'w',1).length,1)
})
test('scale indipendenti preservano dati, distanze temporali reali e punti singoli', () => {
 const points=[{at:'2026-01-01T00:00:00Z',serie:3,rip:12},{at:'2026-01-02T00:00:00Z',serie:4,rip:10},{at:'2026-01-05T00:00:00Z',serie:2,rip:20}]
 const original=structuredClone(points),lines=chartLayout(points,['serie','rip'],true)
 assert.equal(lines[0].max,4);assert.equal(lines[1].max,20);assert.equal(lines[0].points[1].x,92)
 assert.deepEqual(points,original);assert.equal(chartLayout([points[0]],['serie'])[0].points[0].x,160)
})
test('video condiviso nel catalogo, rimozione esplicita e coda manuale', () => {
 const data=fixture(), s={data,outbox:[]}
 assert.throws(()=>setVideo(data,'e','javascript:alert(1)'),/http/)
 const row=setVideo(data,'e','https://example.org/video');assert.equal(data.esercizi_allenamento.every(p=>p.esercizio_id===row.id),true)
 enqueue(s,'video:e','video_modificato',false,[{table:'esercizi',data:row}]);assert.equal(s.outbox[0].authorized,false)
 setVideo(data,'e','');assert.equal(row.video_url,null);assert.equal(s.outbox[0].records[0].data.video_url,'https://example.org/video')
})
test('storico demo crea cinque sessioni senza sovrascrivere e lascia una incompleta senza fine',async()=>{
 const { seedDemoHistory }=await import('../app/src/data/local/demo-history.js')
 const { prefixed,sessionStatus }=await import('../app/src/domain/session.js')
 const demo=(await import('../examples/scheda-demo.json',{with:{type:'json'}})).default
 const data=emptyData(),w=demo.scheda.allenamenti[0]
 data.schede=[{id:demo.scheda.id,nome:'demo',revisione:1}];data.allenamenti=[{id:w.id,scheda_id:demo.scheda.id,nome:w.nome}];data.esercizi=demo.esercizi
 data.esercizi_allenamento=w.esercizi.map((e,i)=>({id:e.id,esercizio_id:e.esercizio_id,allenamento_id:w.id,posizione:i+1,...prefixed(e.valori,'corrente')}))
 const now='2026-10-30T10:00:00Z',ids=seedDemoHistory(data,new Date(now))
 assert.equal(new Set(ids).size,5);assert.equal(data.sessioni.filter(s=>s.terminata_at).length,4)
 assert.equal(sessionStatus(data.sessioni.at(-1),now),'incompleta');assert.equal(data.sessioni.at(-1).terminata_at,null)
 assert.equal(exercisePoints(data,demo.esercizi[0].id).length,5)
})
