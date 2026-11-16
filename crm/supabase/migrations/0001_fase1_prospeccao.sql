-- CRM Pedro Hoffman · Fase 1: nichos, lotes, leads e histórico.
-- Rode no Supabase: SQL Editor > New query > cole este arquivo > Run.
-- Toda linha tem um "dono" (o usuário logado) e a RLS só deixa cada um ver o que é seu.

create extension if not exists pgcrypto;

-- Atualiza "atualizado_em" sozinho.
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

-- Nichos -------------------------------------------------------------------
create table public.nichos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (dono, nome)
);

-- Lotes (cada planilha importada) -----------------------------------------
create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  nicho_id uuid references public.nichos (id) on delete set null,
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
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lote_id uuid references public.lotes (id) on delete set null,
  nicho_id uuid references public.nichos (id) on delete set null,

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

create unique index leads_place_id_unico on public.leads (dono, place_id) where place_id is not null;
create index leads_lote on public.leads (lote_id);
create index leads_status on public.leads (dono, status);
create index leads_telefone on public.leads (dono, telefone_normalizado);

create trigger leads_atualizado_em before update on public.leads
  for each row execute function public.tocar_atualizado_em();

-- Histórico do lead ----------------------------------------------------------
create table public.eventos_lead (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  tipo text not null check (tipo in ('importado', 'atualizado', 'mensagem enviada', 'respondeu', 'prévia enviada', 'status alterado', 'observação')),
  texto text,
  criado_em timestamptz not null default now()
);

create index eventos_lead_lead on public.eventos_lead (lead_id, criado_em desc);

-- Segurança (RLS): só o dono enxerga e mexe ---------------------------------
alter table public.nichos enable row level security;
alter table public.lotes enable row level security;
alter table public.leads enable row level security;
alter table public.eventos_lead enable row level security;

create policy "dono" on public.nichos for all using (dono = auth.uid()) with check (dono = auth.uid());
create policy "dono" on public.lotes for all using (dono = auth.uid()) with check (dono = auth.uid());
create policy "dono" on public.leads for all using (dono = auth.uid()) with check (dono = auth.uid());
create policy "dono" on public.eventos_lead for all using (dono = auth.uid()) with check (dono = auth.uid());

-- Desfazer um lote (até 7 dias): apaga os leads que nasceram nele.
-- Leads que já existiam e só foram atualizados continuam.
create or replace function public.desfazer_lote(p_lote uuid)
returns integer language plpgsql security invoker as $$
declare
  apagados integer;
begin
  if not exists (
    select 1 from public.lotes
    where id = p_lote and dono = auth.uid() and desfeito_em is null and criado_em > now() - interval '7 days'
  ) then
    raise exception 'Lote não encontrado, já desfeito ou com mais de 7 dias.';
  end if;

  -- lote_id guarda o lote em que o lead nasceu; atualizações não mudam esse campo.
  delete from public.leads l where l.lote_id = p_lote and l.dono = auth.uid();
  get diagnostics apagados = row_count;

  update public.lotes set desfeito_em = now() where id = p_lote;
  return apagados;
end $$;
