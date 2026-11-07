-- Recuperi per voce del piano; counter e countdown restano solo locali.
begin;
alter table public.esercizi_allenamento
 add column ai_recupero_serie_secondi integer check (ai_recupero_serie_secondi >= 0),
 add column ai_recupero_esercizio_secondi integer check (ai_recupero_esercizio_secondi >= 0),
 add column corrente_recupero_serie_secondi integer check (corrente_recupero_serie_secondi >= 0),
 add column corrente_recupero_esercizio_secondi integer check (corrente_recupero_esercizio_secondi >= 0);
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
 elsif tg_table_name='allenamenti' and tg_op='UPDATE' then
  if new.scheda_id<>old.scheda_id then raise exception 'Riferimento scheda immutabile'; end if;
 elsif tg_table_name='esercizi_allenamento' then
  if tg_op='INSERT' and (new.ai_serie,new.ai_ripetizioni,new.ai_carico_kg,new.ai_durata_secondi,new.ai_distanza_metri,new.ai_recupero_serie_secondi,new.ai_recupero_esercizio_secondi) is distinct from (new.corrente_serie,new.corrente_ripetizioni,new.corrente_carico_kg,new.corrente_durata_secondi,new.corrente_distanza_metri,new.corrente_recupero_serie_secondi,new.corrente_recupero_esercizio_secondi) then raise exception 'Valori iniziali diversi dalla proposta AI'; end if;
  if tg_op='UPDATE' and ((new.esercizio_id,new.allenamento_id) is distinct from (old.esercizio_id,old.allenamento_id)
   or (to_jsonb(new)-array['corrente_recupero_serie_secondi','corrente_recupero_esercizio_secondi','corrente_serie','corrente_ripetizioni','corrente_carico_kg','corrente_durata_secondi','corrente_distanza_metri','posizione','note','deleted_at','updated_at','row_version'])
   is distinct from (to_jsonb(old)-array['corrente_recupero_serie_secondi','corrente_recupero_esercizio_secondi','corrente_serie','corrente_ripetizioni','corrente_carico_kg','corrente_durata_secondi','corrente_distanza_metri','posizione','note','deleted_at','updated_at','row_version'])) then raise exception 'Voce e proposta AI immutabili'; end if;
  select categoria into strict cat from public.esercizi where user_id=new.user_id and id=new.esercizio_id;
  perform private.valida_misure(cat,to_jsonb(new),'ai_'); perform private.valida_misure(cat,to_jsonb(new),'corrente_');
 elsif tg_table_name='sessioni' then
  if tg_op='UPDATE' and (new.allenamento_id,new.scheda_revisione,new.iniziata_at,new.fuso_orario) is distinct from (old.allenamento_id,old.scheda_revisione,old.iniziata_at,old.fuso_orario) then raise exception 'Origine sessione immutabile'; end if;
  if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.fuso_orario) then raise exception 'Fuso orario sconosciuto'; end if;
 elsif tg_table_name='esercizi_sessione' then
  select ea.allenamento_id,e.categoria into strict allenamento,cat from public.esercizi_allenamento ea join public.esercizi e on e.user_id=ea.user_id and e.id=ea.esercizio_id where ea.user_id=new.user_id and ea.id=new.esercizio_allenamento_id;
  if not exists(select 1 from public.sessioni s where s.user_id=new.user_id and s.id=new.sessione_id and s.allenamento_id=allenamento) then raise exception 'Voce estranea alla sessione'; end if;
  if tg_op='UPDATE' and (new.sessione_id,new.esercizio_allenamento_id,new.posizione) is distinct from (old.sessione_id,old.esercizio_allenamento_id,old.posizione) then raise exception 'Riferimenti del risultato immutabili'; end if;
  perform private.valida_misure(cat,to_jsonb(new),'effettivo_',new.stato<>'completato');
  if new.stato='saltato' and (new.effettivo_serie is not null or new.effettivo_ripetizioni is not null or new.effettivo_carico_kg is not null or new.effettivo_durata_secondi is not null or new.effettivo_distanza_metri is not null) then raise exception 'Esercizio saltato con misure'; end if;
 end if;
 return new;
end $$;

insert into private.migrazioni_app(versione) values ('20261101124720');
notify pgrst, 'reload schema';
commit;
