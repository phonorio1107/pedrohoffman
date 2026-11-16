-- Teste de isolamento (RLS). Roda num Postgres local, depois do stub e das migrações.
-- Cada verificação que falha derruba o script com uma mensagem clara.
\set ON_ERROR_STOP on
\set A '\'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\''
\set B '\'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb\''

-- Dois usuários e dados do A, criados como superusuário
insert into auth.users (id, email) values (:A, 'a@teste.local'), (:B, 'b@teste.local');
insert into public.nichos (id, dono, nome) values ('11111111-0000-0000-0000-000000000001', :A, 'Nicho do A');
insert into public.lotes (id, dono, nome, arquivo) values ('22222222-0000-0000-0000-000000000001', :A, 'Lote do A', 'a.xlsx');
insert into public.leads (id, dono, lote_id, nome, presenca, faixa, place_id)
  values ('33333333-0000-0000-0000-000000000001', :A, '22222222-0000-0000-0000-000000000001', 'Lead do A', 'sem_site', 'Alta', 'ID-A');
insert into public.eventos_lead (dono, lead_id, tipo) values (:A, '33333333-0000-0000-0000-000000000001', 'importado');
insert into public.modelos_mensagem (dono, canal, nome, texto) values (:A, 'WhatsApp', 'Geral do A', 'Oi, {{nome}}');

create or replace function pg_temp.deve_falhar(sql text, esperado text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'ERA PARA FALHAR e não falhou: %', sql;
exception when others then
  if sqlerrm like 'ERA PARA FALHAR%' then raise; end if;
  if sqlerrm not like '%' || esperado || '%' then raise exception 'Falhou com outra mensagem. Esperado "%", veio "%"', esperado, sqlerrm; end if;
end $$;
create or replace function pg_temp.exigir(ok boolean, msg text) returns void language plpgsql as $$
begin if not ok then raise exception '%', msg; end if; end $$;
grant execute on function pg_temp.deve_falhar(text, text) to public;
grant execute on function pg_temp.exigir(boolean, text) to public;

-- 1. Anônimo não enxerga nada ---------------------------------------------
set role anon;
select pg_temp.deve_falhar('select * from public.leads', 'permission denied');
select pg_temp.deve_falhar('select * from public.nichos', 'permission denied');
select pg_temp.deve_falhar('select * from public.modelos_mensagem', 'permission denied');
select pg_temp.deve_falhar('select public.desfazer_lote(''22222222-0000-0000-0000-000000000001'')', 'permission denied');
reset role;

-- 2. O B não enxerga nem mexe no que é do A -----------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', :B, false);
do $$ declare n int; begin
  select count(*) into n from public.leads;         if n <> 0 then raise exception 'B viu % lead(s) do A', n; end if;
  select count(*) into n from public.lotes;         if n <> 0 then raise exception 'B viu lote do A'; end if;
  select count(*) into n from public.nichos;        if n <> 0 then raise exception 'B viu nicho do A'; end if;
  select count(*) into n from public.eventos_lead;  if n <> 0 then raise exception 'B viu evento do A'; end if;
  select count(*) into n from public.modelos_mensagem; if n <> 0 then raise exception 'B viu modelo do A'; end if;
  update public.modelos_mensagem set texto = 'invadido';
  get diagnostics n = row_count;                    if n <> 0 then raise exception 'B alterou modelo do A'; end if;
  delete from public.modelos_mensagem;
  get diagnostics n = row_count;                    if n <> 0 then raise exception 'B apagou modelo do A'; end if;
  update public.leads set nome = 'invadido' where id = '33333333-0000-0000-0000-000000000001';
  get diagnostics n = row_count;                    if n <> 0 then raise exception 'B alterou lead do A'; end if;
  delete from public.leads where id = '33333333-0000-0000-0000-000000000001';
  get diagnostics n = row_count;                    if n <> 0 then raise exception 'B apagou lead do A'; end if;
end $$;
select pg_temp.deve_falhar('insert into public.leads (dono, nome, presenca, faixa) values (''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'', ''x'', ''sem_site'', ''Alta'')', 'row-level security');
select pg_temp.deve_falhar('insert into public.modelos_mensagem (dono, canal, nome, texto) values (''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'', ''Direct'', ''x'', ''y'')', 'row-level security');
select pg_temp.deve_falhar('select public.desfazer_lote(''22222222-0000-0000-0000-000000000001'')', 'não encontrado');
reset role;

-- 3. O A enxerga e mexe no que é dele ---------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);
do $$ declare n int; begin
  select count(*) into n from public.leads;         if n <> 1 then raise exception 'A deveria ver 1 lead, viu %', n; end if;
  insert into public.leads (nome, presenca, faixa, place_id) values ('Lead novo do A', 'plataforma', 'Média', 'ID-A2');
  update public.leads set status = 'Contatado' where place_id = 'ID-A2';
  get diagnostics n = row_count;                    if n <> 1 then raise exception 'A não conseguiu atualizar'; end if;
end $$;
-- modelo: um por canal no nível geral; o mesmo canal com nicho é outro modelo
select pg_temp.deve_falhar('insert into public.modelos_mensagem (canal, nome, texto) values (''WhatsApp'', ''duplicado'', ''x'')', 'modelos_unico');
insert into public.nichos (id, nome) values ('11111111-0000-0000-0000-000000000002', 'Outro nicho');
insert into public.modelos_mensagem (nicho_id, canal, nome, texto) values ('11111111-0000-0000-0000-000000000002', 'WhatsApp', 'Do nicho', 'Oi');
select pg_temp.deve_falhar('insert into public.modelos_mensagem (canal, nome, texto) values (''Direct'', ''x'', '''')', 'check constraint');
-- place_id repetido para o mesmo dono é recusado
select pg_temp.deve_falhar('insert into public.leads (nome, presenca, faixa, place_id) values (''dup'', ''sem_site'', ''Alta'', ''ID-A'')', 'leads_place_id_unico');
-- regras de domínio
select pg_temp.deve_falhar('insert into public.leads (nome, presenca, faixa) values (''x'', ''invalida'', ''Alta'')', 'check constraint');
select pg_temp.deve_falhar('insert into public.leads (nome, presenca, faixa, nota_oportunidade) values (''x'', ''sem_site'', ''Alta'', 101)', 'check constraint');
-- desfazer lote: apaga o lead que nasceu no lote e marca o lote
select public.desfazer_lote('22222222-0000-0000-0000-000000000001') as apagados \gset
select pg_temp.exigir(:apagados = 1, 'desfazer_lote deveria apagar exatamente 1 lead') ;
select pg_temp.deve_falhar('select public.desfazer_lote(''22222222-0000-0000-0000-000000000001'')', 'já desfeito');
reset role;

-- 4. O schema de controle não é acessível pelo app -------------------------------
set role authenticated;
select pg_temp.deve_falhar('select * from controle.migracoes', 'permission denied');
reset role;

\echo 'ISOLAMENTO: tudo certo'
