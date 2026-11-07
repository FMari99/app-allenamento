-- Test fittizi in transazione: nessun dato personale.
begin;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $test$
declare payload jsonb := $payload$[{"tabella": "esercizi", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-000000000001", "nome": "Piegamenti demo", "istruzioni": "Dati fittizi per verificare il software.", "categoria": "ripetizioni", "convenzione_carico": null, "convenzione_ripetizioni": "totali"}}, {"tabella": "esercizi", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-000000000002", "nome": "Curl demo", "istruzioni": "Dati fittizi per verificare il software.", "categoria": "ripetizioni_carico", "convenzione_carico": "totale", "convenzione_ripetizioni": "totali"}}, {"tabella": "esercizi", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-000000000003", "nome": "Plank demo", "istruzioni": "Dati fittizi per verificare il software.", "categoria": "durata", "convenzione_carico": null, "convenzione_ripetizioni": null}}, {"tabella": "esercizi", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-000000000004", "nome": "Tenuta demo", "istruzioni": "Dati fittizi per verificare il software.", "categoria": "durata_carico", "convenzione_carico": "totale", "convenzione_ripetizioni": null}}, {"tabella": "esercizi", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-000000000005", "nome": "Camminata demo", "istruzioni": "Dati fittizi per verificare il software.", "categoria": "distanza_durata", "convenzione_carico": null, "convenzione_ripetizioni": null}}, {"tabella": "schede", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-000000000065", "nome": "Scheda dimostrativa", "note": "Cinque categorie, nessuna prescrizione personale."}}, {"tabella": "allenamenti", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-000000000066", "nome": "Allenamento di prova", "note": "", "scheda_id": "00000000-0000-0000-0000-000000000065", "posizione": 1}}, {"tabella": "esercizi_allenamento", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-00000000000b", "esercizio_id": "00000000-0000-0000-0000-000000000001", "allenamento_id": "00000000-0000-0000-0000-000000000066", "posizione": 1, "note": "", "ai_serie": 3, "ai_ripetizioni": 8, "corrente_serie": 3, "corrente_ripetizioni": 8}}, {"tabella": "esercizi_allenamento", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-00000000000c", "esercizio_id": "00000000-0000-0000-0000-000000000002", "allenamento_id": "00000000-0000-0000-0000-000000000066", "posizione": 2, "note": "", "ai_serie": 3, "ai_ripetizioni": 8, "ai_carico_kg": 2.5, "corrente_serie": 3, "corrente_ripetizioni": 8, "corrente_carico_kg": 2.5}}, {"tabella": "esercizi_allenamento", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-00000000000d", "esercizio_id": "00000000-0000-0000-0000-000000000003", "allenamento_id": "00000000-0000-0000-0000-000000000066", "posizione": 3, "note": "", "ai_serie": 3, "ai_durata_secondi": 30, "corrente_serie": 3, "corrente_durata_secondi": 30}}, {"tabella": "esercizi_allenamento", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-00000000000e", "esercizio_id": "00000000-0000-0000-0000-000000000004", "allenamento_id": "00000000-0000-0000-0000-000000000066", "posizione": 4, "note": "", "ai_serie": 3, "ai_durata_secondi": 30, "ai_carico_kg": 2.5, "corrente_serie": 3, "corrente_durata_secondi": 30, "corrente_carico_kg": 2.5}}, {"tabella": "esercizi_allenamento", "versione_attesa": 0, "dati": {"id": "00000000-0000-0000-0000-00000000000f", "esercizio_id": "00000000-0000-0000-0000-000000000005", "allenamento_id": "00000000-0000-0000-0000-000000000066", "posizione": 5, "note": "", "ai_distanza_metri": 1000, "ai_durata_secondi": 30, "corrente_distanza_metri": 1000, "corrente_durata_secondi": 30}}]$payload$::jsonb; primo jsonb; secondo jsonb;
begin
 primo:=public.salva_gruppo('00000000-0000-0000-0000-000000000100',payload);
 secondo:=public.salva_gruppo('00000000-0000-0000-0000-000000000100',payload);
 if primo<>secondo or (select count(*) from public.esercizi_allenamento)<>5 then raise exception 'Reinvio non idempotente'; end if;
 begin
  perform public.salva_gruppo('00000000-0000-0000-0000-000000000100',payload||payload);
  raise exception 'TEST FALLITO: ID riutilizzato accettato';
 exception when raise_exception then if sqlerrm like 'TEST FALLITO%' then raise; end if; end;
 begin
  perform public.salva_gruppo('00000000-0000-0000-0000-000000000200','[{"tabella":"strumenti","versione_attesa":0,"dati":{"id":"00000000-0000-0000-0000-000000000201","nome":"Rollback"}},{"tabella":"strumenti","versione_attesa":0,"dati":{"id":"00000000-0000-0000-0000-000000000202","nome":""}}]');
  raise exception 'TEST FALLITO: gruppo non valido accettato';
 exception when check_violation then null; end;
 if exists(select 1 from public.strumenti) then raise exception 'Scrittura parziale'; end if;
 begin
  perform public.salva_gruppo('00000000-0000-0000-0000-000000000203','[{"tabella":"esercizi","versione_attesa":99,"dati":{"id":"00000000-0000-0000-0000-000000000001","nome":"Conflitto"}}]');
  raise exception 'TEST FALLITO: conflitto accettato';
 exception when serialization_failure then null; end;
 begin
  perform public.salva_gruppo('00000000-0000-0000-0000-000000000204','[{"tabella":"esercizi","versione_attesa":1,"dati":{"id":"00000000-0000-0000-0000-000000000001","categoria":"durata","convenzione_ripetizioni":null}}]');
  raise exception 'TEST FALLITO: categoria mutabile';
 exception when raise_exception then if sqlerrm like 'TEST FALLITO%' then raise; end if; end;
 begin
  update public.esercizi set nome='Accesso diretto';
  raise exception 'TEST FALLITO: scrittura diretta consentita';
 exception when insufficient_privilege then null; end;
end $test$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $test$
begin
 perform public.salva_gruppo('00000000-0000-0000-0000-000000000300','[
 {"tabella":"sessioni","versione_attesa":0,"dati":{"id":"00000000-0000-0000-0000-000000000301","allenamento_id":"00000000-0000-0000-0000-000000000066","scheda_revisione":1,"scheda_nome_snapshot":"Demo","allenamento_nome_snapshot":"Prova","iniziata_at":"2026-10-29T09:00:00Z","fuso_orario":"Europe/Rome"}},
 {"tabella":"esercizi_sessione","versione_attesa":0,"dati":{"id":"00000000-0000-0000-0000-000000000302","sessione_id":"00000000-0000-0000-0000-000000000301","esercizio_allenamento_id":"00000000-0000-0000-0000-00000000000b","posizione":1,"effettivo_serie":3,"effettivo_ripetizioni":8}}]');
 if not exists(select 1 from public.esercizi_sessione where stato='da_eseguire' and effettivo_serie=3) then raise exception 'Precompilazione persa'; end if;
 begin
  perform public.salva_gruppo('00000000-0000-0000-0000-000000000303','[{"tabella":"esercizi_sessione","versione_attesa":1,"dati":{"id":"00000000-0000-0000-0000-000000000302","stato":"completato","completato_at":"2026-10-29T09:05:00Z","effettivo_ripetizioni":null}}]');
  raise exception 'TEST FALLITO: risultato incompleto accettato';
 exception when raise_exception then if sqlerrm like 'TEST FALLITO%' then raise; end if; end;
 perform public.salva_gruppo('00000000-0000-0000-0000-000000000304','[{"tabella":"esercizi_sessione","versione_attesa":1,"dati":{"id":"00000000-0000-0000-0000-000000000302","stato":"completato","completato_at":"2026-10-29T09:05:00Z"}}]');
 if not exists(select 1 from public.esercizi_sessione where stato='completato' and row_version=2) then raise exception 'Conferma o versione errata'; end if;
 -- La modifica del piano non riscrive il risultato precompilato/confermato.
 perform public.salva_gruppo('00000000-0000-0000-0000-000000000305','[{"tabella":"schede","versione_attesa":1,"dati":{"id":"00000000-0000-0000-0000-000000000065","revisione":2}},{"tabella":"esercizi_allenamento","versione_attesa":1,"dati":{"id":"00000000-0000-0000-0000-00000000000b","corrente_ripetizioni":10}}]');
 if not exists(select 1 from public.esercizi_sessione where effettivo_ripetizioni=8) then raise exception 'Risultato modificato dal piano'; end if;
 begin
  perform public.salva_gruppo('00000000-0000-0000-0000-000000000306','[{"tabella":"schede","versione_attesa":2,"dati":{"id":"00000000-0000-0000-0000-000000000065","revisione":3}},{"tabella":"esercizi_allenamento","versione_attesa":2,"dati":{"id":"00000000-0000-0000-0000-00000000000b","ai_ripetizioni":10}}]');
  raise exception 'TEST FALLITO: proposta AI mutabile';
 exception when raise_exception then if sqlerrm like 'TEST FALLITO%' then raise; end if; end;
end $test$;

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $test$ begin
 if current_setting('app.test_single_user',true) is distinct from 'true' and exists(select 1 from public.schede) then raise exception 'RLS: dati altrui visibili'; end if;
 begin
  perform public.salva_gruppo('00000000-0000-0000-0000-000000000205','[{"tabella":"allenamenti","versione_attesa":0,"dati":{"id":"00000000-0000-0000-0000-000000000206","scheda_id":"00000000-0000-0000-0000-000000000065","nome":"Altrui","posizione":1}},{"tabella":"schede","versione_attesa":1,"dati":{"id":"00000000-0000-0000-0000-000000000065","revisione":2}}]');
  raise exception 'TEST FALLITO: riferimento altrui accettato';
 exception when serialization_failure or foreign_key_violation then null; end;
end $test$;
select set_config('request.jwt.claim.sub','',true);
do $test$ begin
 begin
  perform public.salva_gruppo('00000000-0000-0000-0000-000000000207','[]');
  raise exception 'TEST FALLITO: anonimo accettato';
 exception when insufficient_privilege then null; end;
end $test$;
set constraints all immediate;
rollback;
