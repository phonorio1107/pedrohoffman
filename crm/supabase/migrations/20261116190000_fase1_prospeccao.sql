-- CRM Pedro Hoffman · Fase 1: nichos, lotes, leads e histórico.
-- Não rode este arquivo direto: use o de supabase/aplicar/, que já registra a migração.
-- Tudo mora no schema "crm", separado do schema "public" (onde ficam outros sistemas, como o Hub).
-- Este SQL só cria coisas novas dentro de "crm": não lê nem altera nada do "public".
-- Toda linha tem um "dono" (o usuário logado) e a RLS só deixa cada um ver o que é seu.
-- Com "Automatically expose new tables" desligado, cada tabela precisa de grant explícito.

create schema if not exists crm;
-- O app (usuário logado) precisa enxergar o schema; o acesso anônimo fica fechado.
revoke all on schema crm from anon;
grant usage on schema crm to authenticated;

-- Atualiza "atualizado_em" sozinho.
create or replace function crm.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

-- Nichos -------------------------------------------------------------------
create table crm.nichos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (dono, nome)
);

-- Lotes (cada planilha importada) -----------------------------------------
create table crm.lotes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  nicho_id uuid references crm.nichos (id) on delete set null,
  arquivo text not null,
  total_linhas integer not null default 0,
  novos integer not null default 0,
  atualizados integer not null default 0,
  sem_contato integer not null default 0,
  descartados integer not null default 0,
  desfeito_em timestamptz,
  criado_em timestamptz not null default now()
);

-- Leads --------------------------------------------------------------------
create table crm.leads (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lote_id uuid references crm.lotes (id) on delete set null,
  nicho_id uuid references crm.nichos (id) on delete set null,

  -- Dados do Google Maps
  nome text not null,
  categoria text,
  endereco text,
  bairro text,
  cidade text,
  telefone text,
  telefone_normalizado text,
  whatsapp_provavel boolean not null default false,
  email text,
  site text,
  instagram text,
  facebook text,
  link_maps text,
  place_id text,
  nota_google numeric(2, 1),
  avaliacoes integer,
  horario text,
  situacao text,

  -- Leitura do sistema
  presenca text not null check (presenca in ('sem_site', 'so_instagram', 'so_ifood', 'plataforma', 'site_proprio')),
  rede boolean not null default false,
  nota_oportunidade integer not null default 0 check (nota_oportunidade between 0 and 100),
  faixa text not null check (faixa in ('Alta', 'Média', 'Baixa')),
  motivos jsonb not null default '[]'::jsonb,

  -- Acompanhamento
  status text not null default 'Novo' check (status in ('Novo', 'Contatado', 'Respondeu', 'Prévia enviada', 'Piloto', 'Cliente', 'Descartado', 'Sem contato')),
  motivo_descarte text,
  proximo_passo text,
  data_proximo_passo date,
  observacoes text,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index leads_place_id_unico on crm.leads (dono, place_id) where place_id is not null;
create index leads_lote on crm.leads (lote_id);
create index leads_status on crm.leads (dono, status);
create index leads_telefone on crm.leads (dono, telefone_normalizado);

create trigger leads_atualizado_em before update on crm.leads
  for each row execute function crm.tocar_atualizado_em();

-- Histórico do lead ----------------------------------------------------------
create table crm.eventos_lead (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lead_id uuid not null references crm.leads (id) on delete cascade,
  tipo text not null check (tipo in ('importado', 'atualizado', 'mensagem enviada', 'respondeu', 'prévia enviada', 'status alterado', 'observação')),
  texto text,
  criado_em timestamptz not null default now()
);

create index eventos_lead_lead on crm.eventos_lead (lead_id, criado_em desc);

-- Segurança: RLS ligada, grants explícitos e uma política por operação ------
alter table crm.nichos enable row level security;
alter table crm.lotes enable row level security;
alter table crm.leads enable row level security;
alter table crm.eventos_lead enable row level security;

revoke all on crm.nichos, crm.lotes, crm.leads, crm.eventos_lead from anon, authenticated;
grant select, insert, update, delete on crm.nichos, crm.lotes, crm.leads, crm.eventos_lead to authenticated;

create policy "nichos_select" on crm.nichos for select to authenticated using (dono = auth.uid());
create policy "nichos_insert" on crm.nichos for insert to authenticated with check (dono = auth.uid());
create policy "nichos_update" on crm.nichos for update to authenticated using (dono = auth.uid()) with check (dono = auth.uid());
create policy "nichos_delete" on crm.nichos for delete to authenticated using (dono = auth.uid());

create policy "lotes_select" on crm.lotes for select to authenticated using (dono = auth.uid());
create policy "lotes_insert" on crm.lotes for insert to authenticated with check (dono = auth.uid());
create policy "lotes_update" on crm.lotes for update to authenticated using (dono = auth.uid()) with check (dono = auth.uid());
create policy "lotes_delete" on crm.lotes for delete to authenticated using (dono = auth.uid());

create policy "leads_select" on crm.leads for select to authenticated using (dono = auth.uid());
create policy "leads_insert" on crm.leads for insert to authenticated with check (dono = auth.uid());
create policy "leads_update" on crm.leads for update to authenticated using (dono = auth.uid()) with check (dono = auth.uid());
create policy "leads_delete" on crm.leads for delete to authenticated using (dono = auth.uid());

create policy "eventos_lead_select" on crm.eventos_lead for select to authenticated using (dono = auth.uid());
create policy "eventos_lead_insert" on crm.eventos_lead for insert to authenticated with check (dono = auth.uid());
create policy "eventos_lead_update" on crm.eventos_lead for update to authenticated using (dono = auth.uid()) with check (dono = auth.uid());
create policy "eventos_lead_delete" on crm.eventos_lead for delete to authenticated using (dono = auth.uid());

-- Desfazer um lote (até 7 dias): apaga os leads que nasceram nele.
-- Leads que já existiam e só foram atualizados continuam.
create or replace function crm.desfazer_lote(p_lote uuid)
returns integer language plpgsql security invoker as $$
declare
  apagados integer;
begin
  if not exists (
    select 1 from crm.lotes
    where id = p_lote and dono = auth.uid() and desfeito_em is null and criado_em > now() - interval '7 days'
  ) then
    raise exception 'Lote não encontrado, já desfeito ou com mais de 7 dias.';
  end if;

  -- lote_id guarda o lote em que o lead nasceu; atualizações não mudam esse campo.
  delete from crm.leads l where l.lote_id = p_lote and l.dono = auth.uid();
  get diagnostics apagados = row_count;

  update crm.lotes set desfeito_em = now() where id = p_lote;
  return apagados;
end $$;

revoke all on function crm.desfazer_lote(uuid) from public, anon;
grant execute on function crm.desfazer_lote(uuid) to authenticated;
