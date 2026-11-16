#!/usr/bin/env bash
# Sobe um Postgres local descartável e roda: stub do Supabase, migrações (pelo arquivo
# de aplicar) e o teste de isolamento. Também aplica em banco com dados antigos.
# Uso: sudo ./scripts/testar-banco.sh   (precisa do Postgres instalado)
set -euo pipefail
cd "$(dirname "$0")/.."
RAIZ=$(pwd)
PGBIN=$(ls -d /usr/lib/postgresql/*/bin | tail -1)
DIR=$(mktemp -d); chmod 755 "$DIR"; chown postgres "$DIR"
PORTA=54329
como_pg() { runuser -u postgres -- "$@"; }
como_pg "$PGBIN/initdb" -D "$DIR/dados" -A trust >/dev/null
como_pg "$PGBIN/pg_ctl" -D "$DIR/dados" -o "-p $PORTA -k $DIR" -l "$DIR/log" -w start >/dev/null
trap 'como_pg "$PGBIN/pg_ctl" -D "$DIR/dados" -m immediate stop >/dev/null 2>&1; rm -rf "$DIR"' EXIT
psql_() { psql -h "$DIR" -p $PORTA -U postgres -v ON_ERROR_STOP=1 -q "$@"; }
./scripts/gerar-aplicar.sh >/dev/null

echo "== Banco novo"
psql_ -c "create database novo" 
psql_ -d novo -f supabase/tests/stub-supabase.sql >/dev/null
for f in supabase/aplicar/*.sql; do psql_ -d novo -f "$f" >/dev/null; echo "aplicado: $f"; done
psql_ -d novo -f supabase/tests/isolamento.sql

echo "== Aplicar de novo deve ser recusado"
if psql_ -d novo -f supabase/aplicar/01-fase1_prospeccao.sql >/dev/null 2>&1; then echo "ERRO: aplicou duas vezes"; exit 1; else echo "recusado, como esperado"; fi

echo "== Banco com dados antigos (usuários e e-mails já existentes)"
psql_ -c "create database antigo"
psql_ -d antigo -f supabase/tests/stub-supabase.sql >/dev/null
psql_ -d antigo -c "insert into auth.users (email) select 'usuario' || g || '@antigo.local' from generate_series(1,50) g" 
for f in supabase/aplicar/*.sql; do psql_ -d antigo -f "$f" >/dev/null; done
psql_ -d antigo -f supabase/tests/isolamento.sql
echo "TUDO CERTO"
