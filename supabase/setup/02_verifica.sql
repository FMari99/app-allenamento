-- Eseguire nel SQL Editor dopo aver creato l’account personale.
-- Non richiede password. Tutti i dati fittizi vengono annullati con ROLLBACK.
begin;
do $test$
declare t text; proprietario uuid; secondo uuid:=gen_random_uuid(); strumento uuid:=gen_random_uuid(); op uuid:=gen_random_uuid(); payload jsonb; prima jsonb; ripetuta jsonb;
begin
 if (select count(*) from private.migrazioni_app)<>5 then raise exception 'Registro migrazioni incompleto'; end if;
 if (select count(*) from auth.users)<>1 then raise exception 'Atteso un solo account personale in Authentication > Users'; end if;
 select id into strict proprietario from auth.users;
 foreach t in array array['strumenti','esercizi','esercizi_strumenti','attrezzatura_disponibile','schede','allenamenti','esercizi_allenamento','sessioni','esercizi_sessione','operazioni_sync'] loop
  if not exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=t and c.relrowsecurity) then raise exception 'RLS assente: %',t; end if;
  if has_table_privilege('anon','public.'||t,'SELECT') or has_table_privilege('authenticated','public.'||t,'INSERT') or has_table_privilege('authenticated','public.'||t,'UPDATE') or has_table_privilege('authenticated','public.'||t,'DELETE') then raise exception 'Permessi eccessivi: %',t; end if;
 end loop;
 perform set_config('request.jwt.claim.sub',proprietario::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',proprietario,'role','authenticated')::text,true);
 execute 'set local role authenticated';
 if not row_security_active('public.strumenti') then raise exception 'RLS non attiva nella prova'; end if;
 payload:=jsonb_build_array(jsonb_build_object('tabella','strumenti','versione_attesa',0,'dati',jsonb_build_object('id',strumento,'nome','Verifica temporanea '||strumento)));
 prima:=public.salva_gruppo(op,payload);
 ripetuta:=public.salva_gruppo(op,payload);
 if prima<>ripetuta then raise exception 'Reinvio non idempotente'; end if;
 if not exists(select 1 from public.strumenti where id=strumento) then raise exception 'Dati propri non leggibili'; end if;
 begin
  perform public.salva_gruppo(gen_random_uuid(),jsonb_build_array(jsonb_build_object('tabella','strumenti','versione_attesa',99,'dati',jsonb_build_object('id',strumento,'nome','Conflitto'))));
  raise exception 'TEST FALLITO: conflitto non rilevato';
 exception when serialization_failure then null; end;
 begin
  perform public.salva_gruppo(gen_random_uuid(),jsonb_build_array(
   jsonb_build_object('tabella','strumenti','versione_attesa',0,'dati',jsonb_build_object('id',secondo,'nome','Rollback temporaneo '||secondo)),
   jsonb_build_object('tabella','strumenti','versione_attesa',0,'dati',jsonb_build_object('id',gen_random_uuid(),'nome',''))));
  raise exception 'TEST FALLITO: gruppo non valido accettato';
 exception when check_violation then null; end;
 if exists(select 1 from public.strumenti where id=secondo) then raise exception 'Rollback parziale'; end if;
 perform set_config('request.jwt.claim.sub',secondo::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',secondo,'role','authenticated')::text,true);
 if exists(select 1 from public.strumenti where id=strumento) then raise exception 'Dati altrui leggibili'; end if;
 begin
  perform public.salva_gruppo(gen_random_uuid(),jsonb_build_array(jsonb_build_object('tabella','strumenti','versione_attesa',1,'dati',jsonb_build_object('id',strumento,'nome','Modifica altrui'))));
  raise exception 'TEST FALLITO: scrittura altrui consentita';
 exception when serialization_failure then null; end;
 execute 'reset role';
end $test$;
rollback;
select 'Verifiche SQL superate; dati di prova annullati. Login/API da verificare separatamente.' as esito;
