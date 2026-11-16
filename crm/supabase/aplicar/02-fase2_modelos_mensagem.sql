-- CRM Pedro Hoffman · 20261116200000_fase2_modelos_mensagem
-- Cole no Supabase: SQL Editor > New query > Run. Se aparecer "Run and enable RLS", pode confirmar.
begin;
create schema if not exists controle;
create table if not exists controle.migracoes (nome text primary key, aplicada_em timestamptz not null default now());
revoke all on schema controle from anon, authenticated;
revoke all on controle.migracoes from anon, authenticated;
do $$ begin
  if exists (select 1 from controle.migracoes where nome = '20261116200000_fase2_modelos_mensagem') then
    raise exception 'A migração 20261116200000_fase2_modelos_mensagem já foi aplicada neste banco.';
  end if;
end $$;
-- CRM Pedro Hoffman · Fase 2: modelos de mensagem.
-- Um modelo por nicho e canal. nicho_id nulo = modelo geral, usado quando o nicho não tem o seu.
-- Com "Automatically expose new tables" desligado, a tabela precisa de grant explícito.

create table public.modelos_mensagem (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nicho_id uuid references public.nichos (id) on delete cascade,
  canal text not null check (canal in ('WhatsApp', 'Direct', 'E-mail')),
  nome text not null,
  texto text not null check (length(texto) between 1 and 4000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Um modelo por dono, nicho e canal (o nulo conta como "geral").
create unique index modelos_unico on public.modelos_mensagem (dono, coalesce(nicho_id, '00000000-0000-0000-0000-000000000000'::uuid), canal);

create trigger modelos_atualizado_em before update on public.modelos_mensagem
  for each row execute function public.tocar_atualizado_em();

alter table public.modelos_mensagem enable row level security;

revoke all on public.modelos_mensagem from anon, authenticated;
grant select, insert, update, delete on public.modelos_mensagem to authenticated;

create policy "modelos_select" on public.modelos_mensagem for select to authenticated using (dono = auth.uid());
create policy "modelos_insert" on public.modelos_mensagem for insert to authenticated with check (dono = auth.uid());
create policy "modelos_update" on public.modelos_mensagem for update to authenticated using (dono = auth.uid()) with check (dono = auth.uid());
create policy "modelos_delete" on public.modelos_mensagem for delete to authenticated using (dono = auth.uid());

insert into controle.migracoes (nome) values ('20261116200000_fase2_modelos_mensagem');
commit;
