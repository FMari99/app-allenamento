begin;
alter table public.strumenti add column note text not null default '';
insert into private.migrazioni_app(versione) values ('20261110094815');
notify pgrst, 'reload schema';
commit;
