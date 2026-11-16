-- Imita o que o Supabase já traz pronto, só para testar as migrações num Postgres local.
-- NÃO rode no Supabase de verdade.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema public, auth to anon, authenticated, service_role;
-- Como no Supabase com "expor tabelas novas" desligado: nada vem liberado por padrão.
alter default privileges in schema public revoke all on tables from anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
