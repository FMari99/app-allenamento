begin;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $test$
declare tool uuid:=gen_random_uuid(); inv uuid:=gen_random_uuid(); exercise uuid:=gen_random_uuid(); link uuid:=gen_random_uuid(); op uuid:=gen_random_uuid(); changes jsonb; receipt jsonb; owner_id uuid:=auth.uid();
begin
 changes:=jsonb_build_array(
 jsonb_build_object('tabella','strumenti','versione_attesa',0,'dati',jsonb_build_object('id',tool,'nome','Test attrezzatura '||tool)),
 jsonb_build_object('tabella','attrezzatura_disponibile','versione_attesa',0,'dati',jsonb_build_object('id',inv,'strumento_id',tool)),
 jsonb_build_object('tabella','esercizi','versione_attesa',0,'dati',jsonb_build_object('id',exercise,'nome','Test esercizio '||exercise,'categoria','ripetizioni','convenzione_ripetizioni','totali')),
 jsonb_build_object('tabella','esercizi_strumenti','versione_attesa',0,'dati',jsonb_build_object('id',link,'esercizio_id',exercise,'strumento_id',tool,'ruolo','necessario')));
 receipt:=public.salva_gruppo(op,changes);
 if public.salva_gruppo(op,changes)<>receipt then raise exception 'Ricevuta non ripetibile'; end if;
 if not exists(select 1 from public.strumenti where id=tool and note='') then raise exception 'Default note errato'; end if;
 perform public.salva_gruppo(gen_random_uuid(),jsonb_build_array(jsonb_build_object('tabella','strumenti','versione_attesa',1,'dati',jsonb_build_object('id',tool,'note',E'Al parco\nDisponibile al mattino'))));
 -- Un vecchio client che non conosce note non deve azzerarle.
 perform public.salva_gruppo(gen_random_uuid(),jsonb_build_array(jsonb_build_object('tabella','strumenti','versione_attesa',2,'dati',jsonb_build_object('id',tool,'nome','Test rinominato '||tool))));
 if not exists(select 1 from public.strumenti where id=tool and note=E'Al parco\nDisponibile al mattino' and row_version=3) then raise exception 'Note perse nel rinomino'; end if;
 if current_setting('app.test_single_user',true) is distinct from 'true' then
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  if exists(select 1 from public.strumenti where id=tool) then raise exception 'Note visibili a un altro proprietario'; end if;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
 end if;
 begin
  perform public.salva_gruppo(gen_random_uuid(),jsonb_build_array(jsonb_build_object('tabella','strumenti','versione_attesa',3,'dati',jsonb_build_object('id',tool,'note',null))));
  raise exception 'TEST FALLITO: note null accettate';
 exception when not_null_violation then null; end;
 perform public.salva_gruppo(gen_random_uuid(),jsonb_build_array(
 jsonb_build_object('tabella','strumenti','versione_attesa',3,'dati',jsonb_build_object('id',tool,'deleted_at',now())),
 jsonb_build_object('tabella','esercizi_strumenti','versione_attesa',1,'dati',jsonb_build_object('id',link,'deleted_at',now())),
 jsonb_build_object('tabella','attrezzatura_disponibile','versione_attesa',1,'dati',jsonb_build_object('id',inv,'deleted_at',now()))));
 if exists(select 1 from public.strumenti where id=tool and deleted_at is null) or exists(select 1 from public.esercizi_strumenti where id=link and deleted_at is null) then raise exception 'Strumento non rimosso'; end if;
 if not exists(select 1 from public.esercizi where id=exercise and deleted_at is null) then raise exception 'Esercizio alterato'; end if;
end $test$;
rollback;
