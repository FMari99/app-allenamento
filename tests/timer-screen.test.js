import test from 'node:test'
import assert from 'node:assert/strict'
import { timerScreen } from '../app/src/domain/timer-screen.js'
import { timerSounds,soundChoice,unlockAudio,playTimerSound,stopTimerSound } from '../app/src/platform/timer-sound.js'
test('countdown, indicatore e tempo oltre la scadenza dipendono da un orario assoluto',()=>{
 const rest={endsAt:61000,duration:60}
 assert.deepEqual(timerScreen(rest,1000),{remaining:60,late:false,elapsed:0,progress:0})
 assert.equal(timerScreen(rest,31000).progress,.5)
 assert.deepEqual(timerScreen(rest,61000),{remaining:0,late:true,elapsed:0,progress:1})
 const reopened=timerScreen(structuredClone(rest),186400);assert.equal(reopened.elapsed,125);assert.equal(reopened.progress,1)
 assert.equal(timerScreen(rest,-10000).progress,0)
})
test('suoni distinti e acuti; anteprima e avviso usano il suono scelto, senza sovrapporsi',async()=>{
 const scheduled=[];let stopped=0
 class Audio {
  state='running';currentTime=0;destination={}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}
  createOscillator(){const o={type:'',frequency:{value:0},connect(){},disconnect(){},start(){scheduled.push(o.frequency.value)},stop(){stopped++}};return o}
 }
 const original=globalThis.AudioContext;globalThis.AudioContext=Audio
 try{
  assert.ok(await unlockAudio());assert.equal(new Set(timerSounds.map(s=>s.id)).size,4)
  assert.ok(timerSounds.every(s=>s.notes.every(n=>n[1]>=1200)))
  assert.equal(soundChoice('invalid').id,'double');assert.ok(playTimerSound('trill'));assert.deepEqual(scheduled,[1480,1760,1480,1760])
  assert.ok(playTimerSound('triple'));assert.ok(stopped>=8);assert.deepEqual(scheduled.slice(-3),[1568,1568,1568]);stopTimerSound()
 }finally{globalThis.AudioContext=original}
})
