#!/usr/bin/env bash
# Gera supabase/aplicar/NN-nome.sql a partir de supabase/migrations/*.sql:
# o arquivo que você cola no SQL Editor do Supabase. Roda dentro de uma transação
# e registra a migração em controle.migracoes (rodar duas vezes não faz estrago).
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
    echo "create schema if not exists controle;"
    echo "create table if not exists controle.migracoes (nome text primary key, aplicada_em timestamptz not null default now());"
    echo "revoke all on schema controle from anon, authenticated;"
    echo "revoke all on controle.migracoes from anon, authenticated;"
    echo "do \$\$ begin"
    echo "  if exists (select 1 from controle.migracoes where nome = '$base') then"
    echo "    raise exception 'A migração $base já foi aplicada neste banco.';"
    echo "  end if;"
    echo "end \$\$;"
    cat "$f"
    echo
    echo "insert into controle.migracoes (nome) values ('$base');"
    echo "commit;"
  } > "$saida"
  echo "gerado: $saida"
done
