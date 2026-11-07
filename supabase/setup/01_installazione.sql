-- App allenamento: setup iniziale riproducibile.
-- Eseguire solo nella dashboard di un progetto Supabase nuovo e vuoto.
-- Il controllo iniziale rifiuta tabelle preesistenti in public; non cancella dati.
begin;
do $guard$ begin
 if exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind in ('r','p','v','m','f')) then
  raise exception 'Schema public non vuoto: fermarsi e comunicare il messaggio all’assistente. Nessun dato cancellato.';
 end if;
end $guard$;
-- Prima versione: applicare solo al progetto Supabase di sviluppo selezionato.
create schema if not exists private;
revoke all on schema private from public;
create table public.strumenti(
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete restrict,
created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
row_version bigint not null default 1 check(row_version>0), deleted_at timestamptz,
unique(user_id,id),
nome text not null check(btrim(nome) <> '')
);
alter table public.strumenti enable row level security;
create policy proprietario on public.strumenti for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.strumenti from anon,authenticated;
grant select on public.strumenti to authenticated;
create table public.esercizi(
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete restrict,
created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
row_version bigint not null default 1 check(row_version>0), deleted_at timestamptz,
unique(user_id,id),
nome text not null check(btrim(nome) <> ''), istruzioni text not null default '', categoria text not null check(categoria in ('ripetizioni','ripetizioni_carico','durata','durata_carico','distanza_durata')),
convenzione_carico text check(convenzione_carico in ('totale','per_attrezzo')),
convenzione_ripetizioni text check(convenzione_ripetizioni in ('totali','per_lato')), video_url text,
check((categoria in ('ripetizioni_carico','durata_carico')) = (convenzione_carico is not null)),
check((categoria in ('ripetizioni','ripetizioni_carico')) = (convenzione_ripetizioni is not null))
);
alter table public.esercizi enable row level security;
create policy proprietario on public.esercizi for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.esercizi from anon,authenticated;
grant select on public.esercizi to authenticated;
create table public.esercizi_strumenti(
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete restrict,
created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
row_version bigint not null default 1 check(row_version>0), deleted_at timestamptz,
unique(user_id,id),
esercizio_id uuid not null, strumento_id uuid not null, ruolo text not null check(ruolo in ('necessario','utile')), unique(user_id,esercizio_id,strumento_id),foreign key(user_id,esercizio_id) references public.esercizi(user_id,id) on delete restrict,foreign key(user_id,strumento_id) references public.strumenti(user_id,id) on delete restrict
);
alter table public.esercizi_strumenti enable row level security;
create policy proprietario on public.esercizi_strumenti for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.esercizi_strumenti from anon,authenticated;
grant select on public.esercizi_strumenti to authenticated;
create table public.attrezzatura_disponibile(
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete restrict,
created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
row_version bigint not null default 1 check(row_version>0), deleted_at timestamptz,
unique(user_id,id),
strumento_id uuid not null,unique(user_id,strumento_id),foreign key(user_id,strumento_id) references public.strumenti(user_id,id) on delete restrict
);
alter table public.attrezzatura_disponibile enable row level security;
create policy proprietario on public.attrezzatura_disponibile for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.attrezzatura_disponibile from anon,authenticated;
grant select on public.attrezzatura_disponibile to authenticated;
create table public.schede(
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete restrict,
created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
row_version bigint not null default 1 check(row_version>0), deleted_at timestamptz,
unique(user_id,id),
nome text not null check(btrim(nome) <> ''),note text not null default '',revisione integer not null default 1 check(revisione>0)
);
alter table public.schede enable row level security;
create policy proprietario on public.schede for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.schede from anon,authenticated;
grant select on public.schede to authenticated;
create table public.allenamenti(
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete restrict,
created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
row_version bigint not null default 1 check(row_version>0), deleted_at timestamptz,
unique(user_id,id),
scheda_id uuid not null,nome text not null check(btrim(nome) <> ''),posizione integer not null check(posizione>0),note text not null default '',foreign key(user_id,scheda_id) references public.schede(user_id,id) on delete restrict
);
alter table public.allenamenti enable row level security;
create policy proprietario on public.allenamenti for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.allenamenti from anon,authenticated;
grant select on public.allenamenti to authenticated;
create table public.esercizi_allenamento(
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete restrict,
created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
row_version bigint not null default 1 check(row_version>0), deleted_at timestamptz,
unique(user_id,id),
allenamento_id uuid not null,esercizio_id uuid not null,posizione integer not null check(posizione>0),note text not null default '',ai_serie integer check(ai_serie > 0),
ai_ripetizioni integer check(ai_ripetizioni > 0),
ai_carico_kg numeric(10,3) check(ai_carico_kg >= 0 and ai_carico_kg <> 'NaN'::numeric),
ai_durata_secondi integer check(ai_durata_secondi > 0),
ai_distanza_metri numeric(12,3) check(ai_distanza_metri > 0 and ai_distanza_metri <> 'NaN'::numeric),corrente_serie integer check(corrente_serie > 0),
corrente_ripetizioni integer check(corrente_ripetizioni > 0),
corrente_carico_kg numeric(10,3) check(corrente_carico_kg >= 0 and corrente_carico_kg <> 'NaN'::numeric),
corrente_durata_secondi integer check(corrente_durata_secondi > 0),
corrente_distanza_metri numeric(12,3) check(corrente_distanza_metri > 0 and corrente_distanza_metri <> 'NaN'::numeric),foreign key(user_id,allenamento_id) references public.allenamenti(user_id,id) on delete restrict,foreign key(user_id,esercizio_id) references public.esercizi(user_id,id) on delete restrict
);
alter table public.esercizi_allenamento enable row level security;
create policy proprietario on public.esercizi_allenamento for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.esercizi_allenamento from anon,authenticated;
grant select on public.esercizi_allenamento to authenticated;
create table public.sessioni(
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete restrict,
created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
row_version bigint not null default 1 check(row_version>0), deleted_at timestamptz,
unique(user_id,id),
allenamento_id uuid not null,scheda_revisione integer not null check(scheda_revisione>0),
scheda_nome_snapshot text not null,allenamento_nome_snapshot text not null,iniziata_at timestamptz not null,
terminata_at timestamptz, fuso_orario text not null,check(terminata_at>=iniziata_at),foreign key(user_id,allenamento_id) references public.allenamenti(user_id,id) on delete restrict
);
alter table public.sessioni enable row level security;
create policy proprietario on public.sessioni for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.sessioni from anon,authenticated;
grant select on public.sessioni to authenticated;
create table public.esercizi_sessione(
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete restrict,
created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
row_version bigint not null default 1 check(row_version>0), deleted_at timestamptz,
unique(user_id,id),
sessione_id uuid not null,esercizio_allenamento_id uuid not null,posizione integer not null check(posizione>0),
stato text not null default 'da_eseguire' check(stato in ('da_eseguire','completato','saltato')),completato_at timestamptz,
check((stato='completato')=(completato_at is not null)),effettivo_serie integer check(effettivo_serie > 0),
effettivo_ripetizioni integer check(effettivo_ripetizioni > 0),
effettivo_carico_kg numeric(10,3) check(effettivo_carico_kg >= 0 and effettivo_carico_kg <> 'NaN'::numeric),
effettivo_durata_secondi integer check(effettivo_durata_secondi > 0),
effettivo_distanza_metri numeric(12,3) check(effettivo_distanza_metri > 0 and effettivo_distanza_metri <> 'NaN'::numeric),
unique(user_id,sessione_id,posizione),unique(user_id,sessione_id,esercizio_allenamento_id),
foreign key(user_id,sessione_id) references public.sessioni(user_id,id) on delete restrict,foreign key(user_id,esercizio_allenamento_id) references public.esercizi_allenamento(user_id,id) on delete restrict
);
alter table public.esercizi_sessione enable row level security;
create policy proprietario on public.esercizi_sessione for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.esercizi_sessione from anon,authenticated;
grant select on public.esercizi_sessione to authenticated;
create unique index strumenti_nome_attivo on public.strumenti(user_id,lower(btrim(nome))) where deleted_at is null;
create unique index allenamenti_posizione_attiva on public.allenamenti(user_id,scheda_id,posizione) where deleted_at is null;
create unique index esercizi_posizione_attiva on public.esercizi_allenamento(user_id,allenamento_id,posizione) where deleted_at is null;
create index sessioni_cronologia on public.sessioni(user_id,iniziata_at);
create index voci_esercizio on public.esercizi_allenamento(user_id,esercizio_id);
create index risultati_voce on public.esercizi_sessione(user_id,esercizio_allenamento_id);
create index associazioni_strumento on public.esercizi_strumenti(user_id,strumento_id);
create index risultati_sessione on public.esercizi_sessione(user_id,sessione_id);
create table public.operazioni_sync(
 user_id uuid not null references auth.users(id) on delete restrict,
 operation_id uuid not null,payload_hash text not null,risultato jsonb not null,applicata_at timestamptz not null default now(),primary key(user_id,operation_id)
);
alter table public.operazioni_sync enable row level security;
create policy proprietario on public.operazioni_sync for select to authenticated using((select auth.uid())=user_id);
revoke all on public.operazioni_sync from anon,authenticated;
grant select on public.operazioni_sync to authenticated;

create function private.valida_misure(cat text, dati jsonb, prefisso text, parziale boolean default false) returns void
language plpgsql set search_path='' as $$
declare campo text; richiesti text[];
begin
 richiesti := case cat
 when 'ripetizioni' then array['serie','ripetizioni'] when 'ripetizioni_carico' then array['serie','ripetizioni','carico_kg']
 when 'durata' then array['serie','durata_secondi'] when 'durata_carico' then array['serie','durata_secondi','carico_kg']
 when 'distanza_durata' then array['distanza_metri','durata_secondi'] else null end;
 if richiesti is null then raise exception 'Categoria sconosciuta'; end if;
 foreach campo in array array['serie','ripetizioni','carico_kg','durata_secondi','distanza_metri'] loop
  if campo=any(richiesti) then
   if not parziale and (dati->>(prefisso||campo)) is null then raise exception 'Misura obbligatoria: %',prefisso||campo; end if;
  elsif (dati->>(prefisso||campo)) is not null then raise exception 'Misura incompatibile: %',prefisso||campo;
  end if;
 end loop;
end $$;

create function private.valida_riga() returns trigger language plpgsql set search_path='' as $$
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
  if tg_op='INSERT' and (new.ai_serie,new.ai_ripetizioni,new.ai_carico_kg,new.ai_durata_secondi,new.ai_distanza_metri) is distinct from (new.corrente_serie,new.corrente_ripetizioni,new.corrente_carico_kg,new.corrente_durata_secondi,new.corrente_distanza_metri) then raise exception 'Valori iniziali diversi dalla proposta AI'; end if;
  if tg_op='UPDATE' and ((new.esercizio_id,new.allenamento_id) is distinct from (old.esercizio_id,old.allenamento_id)
   or (to_jsonb(new)-array['corrente_serie','corrente_ripetizioni','corrente_carico_kg','corrente_durata_secondi','corrente_distanza_metri','posizione','note','deleted_at','updated_at','row_version'])
   is distinct from (to_jsonb(old)-array['corrente_serie','corrente_ripetizioni','corrente_carico_kg','corrente_durata_secondi','corrente_distanza_metri','posizione','note','deleted_at','updated_at','row_version'])) then raise exception 'Voce e proposta AI immutabili'; end if;
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
create trigger valida_riga before insert or update on public.strumenti for each row execute function private.valida_riga();
create trigger valida_riga before insert or update on public.esercizi for each row execute function private.valida_riga();
create trigger valida_riga before insert or update on public.esercizi_strumenti for each row execute function private.valida_riga();
create trigger valida_riga before insert or update on public.attrezzatura_disponibile for each row execute function private.valida_riga();
create trigger valida_riga before insert or update on public.schede for each row execute function private.valida_riga();
create trigger valida_riga before insert or update on public.allenamenti for each row execute function private.valida_riga();
create trigger valida_riga before insert or update on public.esercizi_allenamento for each row execute function private.valida_riga();
create trigger valida_riga before insert or update on public.sessioni for each row execute function private.valida_riga();
create trigger valida_riga before insert or update on public.esercizi_sessione for each row execute function private.valida_riga();

-- La sessione e le sue righe devono essere create nello stesso gruppo.
create function private.sessione_non_vuota() returns trigger language plpgsql set search_path='' as $$
declare sid uuid; proprietario uuid;
begin
 proprietario:=new.user_id;
 if tg_table_name='sessioni' then sid:=new.id; else sid:=new.sessione_id; end if;
 if exists(select 1 from public.sessioni s where s.user_id=proprietario and s.id=sid and s.deleted_at is null)
 and not exists(select 1 from public.esercizi_sessione e where e.user_id=proprietario and e.sessione_id=sid and e.deleted_at is null) then
  raise exception 'Una sessione richiede almeno un esercizio';
 end if;
 return null;
end $$;
create constraint trigger sessione_non_vuota after insert or update on public.sessioni deferrable initially deferred for each row execute function private.sessione_non_vuota();
create constraint trigger risultato_sessione_non_vuota after insert or update on public.esercizi_sessione deferrable initially deferred for each row execute function private.sessione_non_vuota();

-- Unico ingresso di scrittura: proprietario dal JWT, identificatori SQL da whitelist,
-- confronto versioni e ricevuta nello stesso commit. Nessuna chiave admin al client.
create function public.salva_gruppo(operation_id uuid, modifiche jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare proprietario uuid:=auth.uid(); impronta text; ricevuta public.operazioni_sync;
 m jsonb; dati jsonb; tabella text; attesa bigint; precedente jsonb; salvata jsonb;
 colonne text; selezione text; assegnazioni text; risultato jsonb:='[]'::jsonb; chiave text; piano uuid;
begin
 if proprietario is null then raise exception 'Accesso richiesto' using errcode='42501'; end if;
 if operation_id is null or jsonb_typeof(modifiche)<>'array' or jsonb_array_length(modifiche)=0 then raise exception 'Gruppo non valido'; end if;
 perform pg_advisory_xact_lock(hashtextextended(proprietario::text,0));
 impronta:=encode(sha256(convert_to(modifiche::text,'UTF8')),'hex');
 select * into ricevuta from public.operazioni_sync o where o.user_id=proprietario and o.operation_id=salva_gruppo.operation_id;
 if found then
  if ricevuta.payload_hash<>impronta then raise exception 'ID operazione riutilizzato con contenuto diverso'; end if;
  return ricevuta.risultato;
 end if;
 for m in select value from jsonb_array_elements(modifiche) loop
  tabella:=m->>'tabella'; dati:=m->'dati'; attesa:=(m->>'versione_attesa')::bigint;
  if tabella is null or tabella<>all(array['strumenti','esercizi','esercizi_strumenti','attrezzatura_disponibile','schede','allenamenti','esercizi_allenamento','sessioni','esercizi_sessione']) then raise exception 'Tabella non consentita'; end if;
  if attesa is null or attesa<0 or jsonb_typeof(dati)<>'object' or (dati->>'id') is null then raise exception 'Modifica non valida'; end if;
  for chiave in select jsonb_object_keys(dati) loop
   if chiave=any(array['user_id','created_at','updated_at','row_version']) or not exists(select 1 from information_schema.columns where table_schema='public' and table_name=tabella and column_name=chiave) then raise exception 'Campo non consentito: %',chiave; end if;
  end loop;
  execute format('select to_jsonb(t) from public.%I t where user_id=$1 and id=$2 for update',tabella) into precedente using proprietario,(dati->>'id')::uuid;
  if (precedente is null and attesa<>0) or (precedente is not null and (precedente->>'row_version')::bigint<>attesa) then raise exception 'Conflitto: %/%',tabella,dati->>'id' using errcode='40001'; end if;
  if tabella='schede' and precedente is not null and (dati->>'revisione')::integer is distinct from (precedente->>'revisione')::integer+1 then raise exception 'Incrementare revisione scheda'; end if;
  -- Le modifiche del piano devono includere la scheda e la versione attesa.
  if tabella in ('allenamenti','esercizi_allenamento') then
   if tabella='allenamenti' then piano:=coalesce(dati->>'scheda_id',precedente->>'scheda_id')::uuid;
   else select scheda_id into piano from public.allenamenti where user_id=proprietario and id=coalesce(dati->>'allenamento_id',precedente->>'allenamento_id')::uuid; end if;
   if piano is null or not exists(select 1 from jsonb_array_elements(modifiche) x where x->>'tabella'='schede' and x->'dati'->>'id'=piano::text) then raise exception 'Manca revisione della scheda nel gruppo'; end if;
  end if;
  dati:=dati||jsonb_build_object('user_id',proprietario);
  select string_agg(format('%I',key),','),string_agg(format('r.%I',key),','),string_agg(format('%I=r.%I',key,key),',') into colonne,selezione,assegnazioni from jsonb_object_keys(dati) key;
  if precedente is null then
   execute format('insert into public.%I as t (%s) select %s from jsonb_populate_record(null::public.%I,$1) r returning to_jsonb(t)',tabella,colonne,selezione,tabella) into salvata using dati;
  else
   execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$1) r where t.user_id=$2 and t.id=$3 returning to_jsonb(t)',tabella,assegnazioni,tabella) into salvata using dati,proprietario,(dati->>'id')::uuid;
  end if;
  risultato:=risultato||jsonb_build_array(jsonb_build_object('tabella',tabella,'riga',salvata));
 end loop;
 insert into public.operazioni_sync(user_id,operation_id,payload_hash,risultato) values(proprietario,operation_id,impronta,risultato);
 return risultato;
end $$;
revoke all on function public.salva_gruppo(uuid,jsonb) from public,anon;
grant execute on function public.salva_gruppo(uuid,jsonb) to authenticated;
revoke all on all functions in schema private from public,anon,authenticated;
-- Registro tecnico delle migrazioni applicate, non esposto nella Data API.
create table private.migrazioni_app (
 versione text primary key,
 applicata_at timestamptz not null default now()
);
revoke all on private.migrazioni_app from public,anon,authenticated;
insert into private.migrazioni_app(versione) values ('202610290001'),('202610290002');
-- Difesa aggiuntiva sul registro interno; nessuna policy client necessaria.
alter table private.migrazioni_app enable row level security;
-- L'event trigger resta attivo; i client non devono invocarlo via RPC.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
 end if;
end $$;
-- Recuperi per voce del piano; counter e countdown restano solo locali.
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
-- Blocchi riutilizzabili nella stessa scheda. Nessuna duplicazione di voci o nuove tabelle esposte.
alter table public.allenamenti
 add column tipo text not null default 'allenamento' check(tipo in ('allenamento','riscaldamento')),
 add column riscaldamento_id uuid,
 add constraint allenamenti_blocco_senza_catene check(tipo='allenamento' or riscaldamento_id is null),
 add constraint allenamenti_scheda_identita unique(user_id,scheda_id,id),
 add constraint allenamenti_riscaldamento_fk foreign key(user_id,scheda_id,riscaldamento_id) references public.allenamenti(user_id,scheda_id,id) on delete restrict;
create index allenamenti_riscaldamento on public.allenamenti(user_id,scheda_id,riscaldamento_id) where riscaldamento_id is not null;
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
   or (to_jsonb(new)-array['corrente_recupero_serie_secondi','corrente_recupero_esercizio_secondi','corrente_serie','corrente_ripetizioni','corrente_carico_kg','corrente_durata_secondi','corrente_distanza_metri','posizione','note','deleted_at','updated_at','row_version'])
   is distinct from (to_jsonb(old)-array['corrente_recupero_serie_secondi','corrente_recupero_esercizio_secondi','corrente_serie','corrente_ripetizioni','corrente_carico_kg','corrente_durata_secondi','corrente_distanza_metri','posizione','note','deleted_at','updated_at','row_version'])) then raise exception 'Voce e proposta AI immutabili'; end if;
  select categoria into strict cat from public.esercizi where user_id=new.user_id and id=new.esercizio_id;
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

insert into private.migrazioni_app(versione) values ('20261102110937');
notify pgrst, 'reload schema';
-- Proposte persistenti per la voce stabile di piano; nessun valore storico viene sovrascritto.
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
select 'Configurazione completata' as esito, count(*) as migrazioni from private.migrazioni_app;
