-- Difesa aggiuntiva sul registro interno; nessuna policy client necessaria.
alter table private.migrazioni_app enable row level security;
-- L'event trigger resta attivo; i client non devono invocarlo via RPC.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
 end if;
end $$;
