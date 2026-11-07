-- Registro tecnico delle migrazioni applicate, non esposto nella Data API.
begin;
create table private.migrazioni_app (
 versione text primary key,
 applicata_at timestamptz not null default now()
);
revoke all on private.migrazioni_app from public,anon,authenticated;
insert into private.migrazioni_app(versione) values ('202610290001'),('202610290002');
commit;
