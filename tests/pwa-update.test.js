import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { mkdtempSync,writeFileSync,readFileSync,rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { localPwa } from '../tools/pwa-plugin.js'
test('aggiornamento service worker: nuova cache, attesa senza reload e archivio/coda intatti',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'allenamento-update-'))
 try {
  writeFileSync(join(dir,'index.html'),'versione-1');localPwa().writeBundle({dir});const old=readFileSync(join(dir,'sw.js'),'utf8')
  writeFileSync(join(dir,'index.html'),'versione-2');localPwa().writeBundle({dir});const next=readFileSync(join(dir,'sw.js'),'utf8');assert.notEqual(old,next)
  const local={outbox:[{operation_id:'pending',payload:{immutabile:true}}],data:{sessione:'offline'}}, saved=structuredClone(local)
  const events={},cachesMap=new Map([['allenamento-static-/app/-old',{}],['altra-app',{}]])
  let claimed=false
  const cache={addAll:async urls=>{assert.ok(urls.includes('https://example.org/app/index.html'))},match:async()=>({cached:true})}
  const sandbox={URL,Promise,self:{registration:{scope:'https://example.org/app/'},clients:{claim:async()=>{claimed=true}},addEventListener:(type,fn)=>events[type]=fn},caches:{open:async name=>{cachesMap.set(name,cache);return cache},keys:async()=>[...cachesMap.keys()],delete:async name=>cachesMap.delete(name)}}
  Object.defineProperty(sandbox,'indexedDB',{get(){throw new Error('Il service worker non deve toccare i dati locali')}})
  vm.runInNewContext(next,sandbox)
  for(const type of ['install','activate']){let completion;events[type]({waitUntil:p=>completion=p});await completion}
  assert.equal(claimed,true);assert.equal(cachesMap.has('altra-app'),true);assert.equal(cachesMap.has('allenamento-static-/app/-old'),false);assert.deepEqual(local,saved)
  assert.equal(next.includes('skipWaiting('),false)
  let intercepted=false
  events.fetch({request:{method:'GET',url:'https://example.org/rest/v1/sessioni'},respondWith:()=>{intercepted=true}});assert.equal(intercepted,false)
 }finally{rmSync(dir,{recursive:true,force:true})}
})
