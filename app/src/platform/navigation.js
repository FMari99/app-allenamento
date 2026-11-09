// Una voce browser per pagina; sfogliare esercizi/giorni aggiorna la voce corrente.
export function createNavigation({ browser, read, restore, canLeave, closeOverlay=()=>false }) {
  const key=crypto.randomUUID()
  let index=0, restoring=false, recovering=false, busy=false
  const entry=(ui,i)=>({allenamento:key,index:i,ui:structuredClone(ui)})
  const samePage=(a,b)=>a.page===b.page && a.sessionId===b.sessionId
  function reset(){
    index=0
    const ui=read(),home={...ui,page:'home',sessionId:null,position:0}
    browser.history.replaceState(entry(home,0),'')
    if(ui.page!=='home'){index=1;browser.history.pushState(entry(ui,index),'')}
  }
  function sync(previous,next){
    if(restoring)return
    if(JSON.stringify(previous)===JSON.stringify(next))return
    if(samePage(previous,next))browser.history.replaceState(entry(next,index),'')
    else{index++;browser.history.pushState(entry(next,index),'')}
  }
  async function pop(event){
    const target=event.state
    if(target?.allenamento!==key)return
    if(recovering){recovering=false;busy=false;return}
    if(busy)return
    busy=true
    if(closeOverlay() || !canLeave()){
      recovering=true;browser.history.go(index-target.index);return
    }
    restoring=true
    try{
      if(await restore(target.ui)){index=target.index;browser.history.replaceState(entry(read(),index),'');browser.scrollTo(0,0)}
      else{recovering=true;browser.history.go(index-target.index)}
    }finally{restoring=false;if(!recovering)busy=false}
  }
  browser.addEventListener('popstate',pop)
  reset()
  return {sync,reset,back(){if(index>0){browser.history.back();return true}return false},dispose(){browser.removeEventListener('popstate',pop)}}
}
