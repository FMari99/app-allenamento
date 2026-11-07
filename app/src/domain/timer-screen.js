import { restRemaining } from './rest.js'
export function timerScreen(rest,now=Date.now()) {
 const remaining=restRemaining(rest,now),late=Boolean(rest && now>=rest.endsAt)
 const elapsed=late ? Math.max(0,Math.floor((now-rest.endsAt)/1000)) : 0
 const duration=Math.max(1,(rest?.duration ?? 0)*1000)
 return {remaining,late,elapsed,progress:rest ? Math.max(0,Math.min(1,1-(rest.endsAt-now)/duration)) : 0}
}
