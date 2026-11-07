-- Proposte persistenti per la voce stabile di piano; nessun valore storico viene sovrascritto.
begin;
alter table public.esercizi_allenamento add column proposta_futura jsonb;
create function private.valida_proposta_futura(p jsonb,cat text) returns void language plpgsql set search_path='' as $$
declare k text; v jsonb; gruppo jsonb;
begin
 if p is null then return; end if;
 if jsonb_typeof(p)<>'object' or not (p ?& array['id','sessione_origine_id','rinviata_sessione_id','promemoria','prima','valori']) then raise exception 'Proposta futura non valida';end if;
 if exists(select 1 from jsonb_object_keys(p) x where x<>all(array['id','sessione_origine_id','rinviata_sessione_id','promemoria','prima','valori'])) then raise exception 'Campo proposta non consentito';end if;
 if p->>'id' is null or p->>'sessione_origine_id' is null then raise exception 'Origine proposta obbligatoria';end if;
 perform (p->>'id')::uuid;perform (p->>'sessione_origine_id')::uuid;perform (p->>'rinviata_sessione_id')::uuid;
 if jsonb_typeof(p->'promemoria')<>'boolean' or jsonb_typeof(p->'prima')<>'object' then raise exception 'Tipo proposta non valido';end if;
 if (p->>'promemoria')::boolean is distinct from (p->'valori'='null'::jsonb) then raise exception 'Promemoria e valori incoerenti';end if;
 if p->'valori'<>'null'::jsonb then
  if jsonb_typeof(p->'valori')<>'object' then raise exception 'Valori futuri non validi';end if;
  perform private.valida_misure(cat,p->'valori','');
 end if;
 perform private.valida_misure(cat,p->'prima','',true);
 for gruppo in select value from jsonb_array_elements(jsonb_build_array(p->'prima',p->'valori')) loop
  if gruppo='null'::jsonb then continue;end if;
  for k,v in select key,value from jsonb_each(gruppo) loop
   if k<>all(array['serie','ripetizioni','carico_kg','durata_secondi','distanza_metri']) then raise exception 'Misura futura sconosciuta';end if;
   if v='null'::jsonb then continue;end if;
   if jsonb_typeof(v)<>'number' then raise exception 'Misura futura non numerica';end if;
   if (v::text)::numeric<0 or (k<>'carico_kg' and (v::text)::numeric=0) then raise exception 'Misura futura fuori intervallo';end if;
   if k=any(array['serie','ripetizioni','durata_secondi']) and ((v::text)::numeric<>trunc((v::text)::numeric) or (v::text)::numeric>2147483647) then raise exception 'Misura futura intera richiesta';end if;
   if k='carico_kg' and (v::text)::numeric>9999999.999 or k='distanza_metri' and (v::text)::numeric>999999999.999 then raise exception 'Misura futura troppo grande';end if;
  end loop;
 end loop;
end $$;
revoke all on function private.valida_proposta_futura(jsonb,text) from public,anon,authenticated;
create or replace function private.valida_riga() returns trigger language plpgsql set search_path='' as $$
declare cat text; allenamento uuid;
begin
 if tg_op='UPDATE' then
  if new.id<>old.id or new.user_id<>old.user_id then raise exception 'Identità immutabile'; end if;
  new.created_at:=old.created_at; new.updated_at:=clock_timestamp(); new.row_version:=old.row_version+1;
 end if;
 if tg_table_name='esercizi' and tg_op='UPDATE' then
  if (new.categoria,new.convenzione_carico,new.convenzione_ripetizioni) is distinct from (old.categoria,old.convenzione_carico,old.convenzione_ripetizioni)
   and exists(select 1 from public.esercizi_allenamento where user_id=old.user_id and esercizio_id=old.id) then raise exception 'Categoria e convenzioni già utilizzate'; end if;
 elsif tg_table_name='allenamenti' then
  if tg_op='UPDATE' and (new.scheda_id,new.tipo,new.riscaldamento_id) is distinct from (old.scheda_id,old.tipo,old.riscaldamento_id) then raise exception 'Origine e blocco riscaldamento immutabili'; end if;
  if new.riscaldamento_id is not null and not exists(select 1 from public.allenamenti w where w.user_id=new.user_id and w.scheda_id=new.scheda_id and w.id=new.riscaldamento_id and w.tipo='riscaldamento') then raise exception 'Riscaldamento estraneo o non valido'; end if;
 elsif tg_table_name='esercizi_allenamento' then
  if tg_op='INSERT' and (new.ai_serie,new.ai_ripetizioni,new.ai_carico_kg,new.ai_durata_secondi,new.ai_distanza_metri,new.ai_recupero_serie_secondi,new.ai_recupero_esercizio_secondi) is distinct from (new.corrente_serie,new.corrente_ripetizioni,new.corrente_carico_kg,new.corrente_durata_secondi,new.corrente_distanza_metri,new.corrente_recupero_serie_secondi,new.corrente_recupero_esercizio_secondi) then raise exception 'Valori iniziali diversi dalla proposta AI'; end if;
  if tg_op='UPDATE' and ((new.esercizio_id,new.allenamento_id) is distinct from (old.esercizio_id,old.allenamento_id)
   or (to_jsonb(new)-array['proposta_futura','corrente_recupero_serie_secondi','corrente_recupero_esercizio_secondi','corrente_serie','corrente_ripetizioni','corrente_carico_kg','corrente_durata_secondi','corrente_distanza_metri','posizione','note','deleted_at','updated_at','row_version'])
   is distinct from (to_jsonb(old)-array['proposta_futura','corrente_recupero_serie_secondi','corrente_recupero_esercizio_secondi','corrente_serie','corrente_ripetizioni','corrente_carico_kg','corrente_durata_secondi','corrente_distanza_metri','posizione','note','deleted_at','updated_at','row_version'])) then raise exception 'Voce e proposta AI immutabili'; end if;
  select categoria into strict cat from public.esercizi where user_id=new.user_id and id=new.esercizio_id;
  perform private.valida_proposta_futura(new.proposta_futura,cat);
  perform private.valida_misure(cat,to_jsonb(new),'ai_'); perform private.valida_misure(cat,to_jsonb(new),'corrente_');
 elsif tg_table_name='sessioni' then
  if not exists(select 1 from public.allenamenti where user_id=new.user_id and id=new.allenamento_id and tipo='allenamento') then raise exception 'La sessione richiede un allenamento'; end if;
  if tg_op='UPDATE' and (new.allenamento_id,new.scheda_revisione,new.iniziata_at,new.fuso_orario) is distinct from (old.allenamento_id,old.scheda_revisione,old.iniziata_at,old.fuso_orario) then raise exception 'Origine sessione immutabile'; end if;
  if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.fuso_orario) then raise exception 'Fuso orario sconosciuto'; end if;
 elsif tg_table_name='esercizi_sessione' then
  select ea.allenamento_id,e.categoria into strict allenamento,cat from public.esercizi_allenamento ea join public.esercizi e on e.user_id=ea.user_id and e.id=ea.esercizio_id where ea.user_id=new.user_id and ea.id=new.esercizio_allenamento_id;
  if not exists(select 1 from public.sessioni s where s.user_id=new.user_id and s.id=new.sessione_id and (s.allenamento_id=allenamento or exists(select 1 from public.allenamenti w where w.user_id=s.user_id and w.id=s.allenamento_id and w.riscaldamento_id=allenamento))) then raise exception 'Voce estranea alla sessione'; end if;
  if tg_op='UPDATE' and (new.sessione_id,new.esercizio_allenamento_id,new.posizione) is distinct from (old.sessione_id,old.esercizio_allenamento_id,old.posizione) then raise exception 'Riferimenti del risultato immutabili'; end if;
  perform private.valida_misure(cat,to_jsonb(new),'effettivo_',new.stato<>'completato');
  if new.stato='saltato' and (new.effettivo_serie is not null or new.effettivo_ripetizioni is not null or new.effettivo_carico_kg is not null or new.effettivo_durata_secondi is not null or new.effettivo_distanza_metri is not null) then raise exception 'Esercizio saltato con misure'; end if;
 end if;
 return new;
end $$;

insert into private.migrazioni_app(versione) values ('20261104155916');
notify pgrst, 'reload schema';
commit;
