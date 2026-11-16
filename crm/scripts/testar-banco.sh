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

# Imita o Hub: tabelas e função com os MESMOS nomes do CRM, já com dados, no schema public.
HUB="create table public.leads (id int primary key, nome text); insert into public.leads values (1, 'lead do hub');
create table public.lotes (id int); create table public.nichos (id int); create table public.eventos_lead (id int); create table public.modelos_mensagem (id int);
create function public.tocar_atualizado_em() returns trigger language plpgsql as \$\$ begin return new; end \$\$;
create function public.desfazer_lote(uuid) returns int language sql as \$\$ select 42 \$\$;"
SNAP="select md5(coalesce((select string_agg(c.relname::text || c.relkind::text, ',' order by c.relname) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public'), '') || coalesce((select string_agg(p.proname::text || pg_get_function_arguments(p.oid), ',' order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'), ''))"

echo "== Banco novo, convivendo com um Hub de mesmos nomes no schema public"
psql_ -c "create database novo" 
psql_ -d novo -f supabase/tests/stub-supabase.sql >/dev/null
psql_ -d novo -c "$HUB"
ANTES=$(psql_ -d novo -At -c "$SNAP")
for f in supabase/aplicar/*.sql; do psql_ -d novo -f "$f" >/dev/null; echo "aplicado: $f"; done
psql_ -d novo -f supabase/tests/isolamento.sql
DEPOIS=$(psql_ -d novo -At -c "$SNAP")
[ "$ANTES" = "$DEPOIS" ] || { echo "ERRO: o SQL do CRM alterou o schema public"; exit 1; }
[ "$(psql_ -d novo -At -c "select nome from public.leads where id = 1")" = "lead do hub" ] || { echo "ERRO: dado do Hub mudou"; exit 1; }
[ "$(psql_ -d novo -At -c "select public.desfazer_lote(gen_random_uuid())")" = "42" ] || { echo "ERRO: função do Hub mudou"; exit 1; }
echo "HUB INTACTO: o schema public ficou igual (tabelas, funções e dados)"

echo "== Aplicar de novo deve ser recusado"
if psql_ -d novo -f supabase/aplicar/01-fase1_prospeccao.sql >/dev/null 2>&1; then echo "ERRO: aplicou duas vezes"; exit 1; else echo "recusado, como esperado"; fi

echo "== Banco com dados antigos (usuários e e-mails já existentes)"
psql_ -c "create database antigo"
psql_ -d antigo -f supabase/tests/stub-supabase.sql >/dev/null
psql_ -d antigo -c "insert into auth.users (email) select 'usuario' || g || '@antigo.local' from generate_series(1,50) g" 
for f in supabase/aplicar/*.sql; do psql_ -d antigo -f "$f" >/dev/null; done
psql_ -d antigo -f supabase/tests/isolamento.sql
echo "TUDO CERTO"
