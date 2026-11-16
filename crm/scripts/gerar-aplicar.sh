#!/usr/bin/env bash
# Gera supabase/aplicar/NN-nome.sql a partir de supabase/migrations/*.sql:
# o arquivo que você cola no SQL Editor do Supabase. Roda dentro de uma transação
# e registra a migração em crm.migracoes (rodar duas vezes não faz estrago).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p supabase/aplicar
n=0
for f in supabase/migrations/*.sql; do
  n=$((n+1)); base=$(basename "$f" .sql); nome=${base#*_}
  saida=$(printf "supabase/aplicar/%02d-%s.sql" "$n" "$nome")
  {
    echo "-- CRM Pedro Hoffman · $base"
    echo "-- Cole no Supabase: SQL Editor > New query > Run. Se aparecer \"Run and enable RLS\", pode confirmar."
    echo "begin;"
    echo "create schema if not exists crm;"
    echo "create table if not exists crm.migracoes (nome text primary key, aplicada_em timestamptz not null default now());"
    echo "revoke all on crm.migracoes from anon, authenticated;"
    echo "do \$\$ begin"
    echo "  if exists (select 1 from crm.migracoes where nome = '$base') then"
    echo "    raise exception 'A migração $base já foi aplicada neste banco.';"
    echo "  end if;"
    echo "end \$\$;"
    cat "$f"
    echo
    echo "insert into crm.migracoes (nome) values ('$base');"
    echo "commit;"
  } > "$saida"
  echo "gerado: $saida"
done
