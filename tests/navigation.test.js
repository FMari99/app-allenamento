import test from 'node:test'
import assert from 'node:assert/strict'
import { createNavigation } from '../app/src/platform/navigation.js'

function harness(initial={page:'home'}){
  let ui=structuredClone(initial),cursor=0,allowed=true,overlay=false,fail=false
  const entries=[null],listeners=new Map()
  const browser={scrollTo(){},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),history:{
    replaceState(state){entries[cursor]=state},
    pushState(state){entries.splice(cursor+1);entries.push(state);cursor++},
    go(delta){const next=cursor+delta;if(next<0 || next>=entries.length)return;cursor=next;queueMicrotask(()=>listeners.get('popstate')?.({state:entries[cursor]}))},
    back(){this.go(-1)},forward(){this.go(1)},
  }}
  const nav=createNavigation({browser,read:()=>ui,restore:async value=>{if(fail)return false;ui=structuredClone(value);return true},canLeave:()=>allowed,closeOverlay:()=>{if(overlay){overlay=false;return true}return false}})
  return {nav,browser,entries,get ui(){return ui},get cursor(){return cursor},go(page,extra={}){const before=ui;ui={...ui,page,...extra};nav.sync(before,ui)},allow(value){allowed=value},overlay(){overlay=true},fail(value){fail=value}}
}
const flush=()=>new Promise(resolve=>setImmediate(resolve))

test('Indietro e Avanti tornano a pagine reali; giorni ed esercizi non riempiono la cronologia',async()=>{
 const h=harness()
 h.go('calendar',{day:'2026-11-04',month:'2026-11'})
 h.go('calendar',{day:'2026-11-09'})
 h.go('review',{sessionId:'s'})
 assert.equal(h.entries.length,3)
 h.nav.back();await flush();assert.equal(h.ui.page,'calendar');assert.equal(h.ui.day,'2026-11-09')
 h.browser.history.forward();await flush();assert.equal(h.ui.page,'review')
 h.nav.back();await flush();h.go('history');assert.equal(h.entries.length,3);assert.equal(h.ui.page,'history')
 h.nav.dispose()
})
test('annullare uscita con bozze ripristina la voce browser, confermarla permette il ritorno',async()=>{
 const h=harness();h.go('calendar');h.go('review',{sessionId:'s'});h.allow(false)
 h.nav.back();await flush();assert.equal(h.ui.page,'review');assert.equal(h.cursor,2)
 h.allow(true);h.nav.back();await flush();assert.equal(h.ui.page,'calendar');assert.equal(h.cursor,1)
 h.nav.dispose()
})
test('Indietro chiude prima un dialogo; errore di persistenza mantiene la pagina',async()=>{
 const h=harness();h.go('calendar');h.overlay();h.nav.back();await flush()
 assert.equal(h.ui.page,'calendar');assert.equal(h.cursor,1)
 h.fail(true);h.nav.back();await flush();assert.equal(h.cursor,1);assert.equal(h.ui.page,'calendar')
 h.fail(false);h.nav.back();await flush();assert.equal(h.ui.page,'home');assert.equal(h.nav.back(),false)
 h.nav.dispose()
})
test('riapertura in un dettaglio conserva un ritorno alla Home e normalizza sessioni concluse',async()=>{
 const h=harness({page:'review',sessionId:'s'})
 assert.equal(h.entries.length,2);h.nav.back();await flush();assert.equal(h.ui.page,'home')
 h.nav.dispose()
})
