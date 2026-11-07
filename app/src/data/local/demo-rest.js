// Tempi brevi dichiaratamente dimostrativi, non prescrizioni di allenamento.
export function seedDemoRests(data,changed=false){
 for(const entry of data.esercizi_allenamento){
  for(const prefix of ['ai','corrente'])for(const [kind,value] of [['serie',10],['esercizio',15]]){
   const key=`${prefix}_recupero_${kind}_secondi`
   if(entry[key]===undefined){entry[key]=value;changed=true}
  }
 }
 return changed
}
