"""Genera il file pronto per SQL Editor sul progetto di sviluppo vuoto."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
header='''-- App allenamento: setup iniziale riproducibile.
-- Eseguire solo nella dashboard di un progetto Supabase nuovo e vuoto.
-- Il controllo iniziale rifiuta tabelle preesistenti in public; non cancella dati.
begin;
do $guard$ begin
 if exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind in ('r','p','v','m','f')) then
  raise exception 'Schema public non vuoto: fermarsi e comunicare il messaggio all’assistente. Nessun dato cancellato.';
 end if;
end $guard$;
'''
# Una sola transazione esterna, comprese entrambe le migrazioni e il registro.
parts=[]
for file in sorted((root/'supabase/migrations').glob('*.sql')):
    lines=file.read_text().splitlines()
    parts.append('\n'.join(line for line in lines if line.strip().lower() not in ('begin;','commit;')))
content=header+'\n'.join(parts)+"\ncommit;\nselect 'Configurazione completata' as esito, count(*) as migrazioni from private.migrazioni_app;\n"
path=root/'supabase/setup/01_installazione.sql'
path.write_text(content)
print('Pronto: supabase/setup/01_installazione.sql')
