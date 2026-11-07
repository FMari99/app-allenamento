let context
const playing=new Set()
export const timerSounds=[
 {id:'double',name:'Doppio bip',description:'Due note acute, brevi e nette.',notes:[[0,1320,.17],[.24,1320,.17]]},
 {id:'trill',name:'Trillo',description:'Quattro note acute alternate.',notes:[[0,1480,.11],[.15,1760,.11],[.30,1480,.11],[.45,1760,.11]]},
 {id:'chime',name:'Campanello',description:'Due toni luminosi, con una coda più lunga.',notes:[[0,1760,.36],[.25,2093,.48]]},
 {id:'triple',name:'Triplo segnale',description:'Tre bip acuti ben distinti.',notes:[[0,1568,.15],[.23,1568,.15],[.46,1568,.25]]},
]
export const soundChoice=id=>timerSounds.find(s=>s.id===id) ?? timerSounds[0]
export async function unlockAudio() {
 try {
  const Audio=globalThis.AudioContext ?? globalThis.webkitAudioContext
  if(!Audio)return false
  context ??= new Audio()
  if(context.state==='suspended')await context.resume()
  return context.state==='running'
 }catch{return false}
}
export function stopTimerSound(){for(const oscillator of playing){try{oscillator.stop()}catch{}}playing.clear()}
export function playTimerSound(id='double') {
 if(!context || context.state!=='running')return false
 try{
  stopTimerSound()
  const now=context.currentTime
  for(const [offset,frequency,duration] of soundChoice(id).notes){
   const oscillator=context.createOscillator(),gain=context.createGain()
   oscillator.type='sine';oscillator.frequency.value=frequency
   gain.gain.setValueAtTime(0,now+offset);gain.gain.linearRampToValueAtTime(.14,now+offset+.015);gain.gain.exponentialRampToValueAtTime(.001,now+offset+duration)
   oscillator.connect(gain);gain.connect(context.destination)
   oscillator.start(now+offset);oscillator.stop(now+offset+duration+.01);playing.add(oscillator)
   oscillator.onended=()=>{playing.delete(oscillator);oscillator.disconnect();gain.disconnect()}
  }
  return true
 }catch{return false}
}
// Non suonare recuperi già scaduti prima della riapertura o rimasti in background.
export function shouldAnnounceRest(previous,rest,now,enabled,visible,notified) {
 return Boolean(enabled && visible && rest && previous?.id===rest.id && previous.remaining>0 && rest.endsAt<=now && now-rest.endsAt<2500 && notified!==rest.id)
}
