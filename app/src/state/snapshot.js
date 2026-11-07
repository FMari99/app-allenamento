// I commit restano immutabili: riutilizzare i rami invariati evita reset e aggiornamenti UI estranei.
export function shareUnchanged(previous,next) {
 if(Object.is(previous,next))return previous
 if(previous===null || next===null || typeof previous!=='object' || typeof next!=='object' || Array.isArray(previous)!==Array.isArray(next))return next
 const before=Object.keys(previous),after=Object.keys(next)
 let same=before.length===after.length
 for(const key of after){
  if(!Object.hasOwn(previous,key)){same=false;continue}
  next[key]=shareUnchanged(previous[key],next[key])
  if(!Object.is(next[key],previous[key]))same=false
 }
 return same ? previous : next
}
