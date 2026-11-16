# PROJETO · CRM Pedro Hoffman

Sistema **interno** de prospecção e carteira. Usuário único: Pedro. Não é de cliente, então as fases de cliente (aprovação, contrato, LGPD de terceiros) viram "n/a" ou ficam adaptadas.

- **Repositório:** `phonorio1107/pedrohoffman`, pasta `crm/` (hoje público; vai ficar privado quando o Pedro ligar dados reais).
- **Design:** canvas "Sistema Pedro Hoffman" (aprovado) + design system "Pedro Hoffman Degrau".
- **Página de teste (modo demonstração):** https://claude.ai/artifact/DXDXtXK2N8wCkNhccwzVr3
- **Nota sobre a skill `novo-cliente-saas`:** a cópia sincronizada só trouxe o `SKILL.md`. As referências (`fases.md`, `banco.md`, `testes.md`, `manutencao.md`, `licoes.md`) e os scripts (`migrar.sh`) não vieram. Este arquivo e os scripts de banco foram montados a partir do resumo do `SKILL.md`. Se as referências existirem em outro lugar, conferir e ajustar.

## Fase atual
**Fase 6 (construir) em andamento: Fase 1 do produto pronta (importar e listar leads).** Bloqueio para dado real: Supabase ainda não criado (Pedro) e repositório ainda público.

## Decisões
| Data | Decisão |
|---|---|
| 16/11 | Plataforma de cardápio (Cardápio Web, MenuDino, Brendi, Linktree...) vale **+27**, igual a "só iFood" |
| 16/11 | Redes e franquias são **descartadas automaticamente** |
| 16/11 | O nicho fica **em aberto**: cada lote recebe o nicho na hora da importação |
| 16/11 | Outscraper: usar **só o Raspador do Google Maps, sem pacote de enriquecimento** |
| 16/11 | O sistema fica neste repositório; o Pedro deixa privado depois |
| 16/11 | Alta oportunidade a partir de 65 (sem e-mail o máximo é 85); Média 45 a 64 |
| 16/11 | Seguir o padrão da skill `novo-cliente-saas` (Workers estáticos, grants explícitos, PROJETO.md) |
| **em aberto** | Onde fica o Supabase: conta do Pedro, plano gratuito ou Pro? (Gratuito: sem backup automático e pausa após 1 semana sem uso) |
| **em aberto** | Chamada padrão nas mensagens: "DOR" no direct ou "me chama no direct" |
| **em aberto** | Domínio do CRM (pode ficar no endereço `.workers.dev` por enquanto) |

## Fases

| # | Fase | Status |
|---|---|---|
| 1 | Descoberta e escopo | ✅ `[x]` escopo definido no chat "Pedro Hoffman CRM system" (prospecção + carteira, 4 fases do produto) |
| 2 | Modelagem e protótipo | ✅ `[x]` canvas com 8 telas; o Pedro aprovou ("curti de momento"), 16/11. Aprovação de cliente: n/a |
| 3 | Contas e repositório | 🟨 repositório `[x]`; Supabase `[ ]` (Pedro); Cloudflare `[ ]` (Pedro); repositório privado `[ ]` (Pedro) |
| 4 | Banco e RLS | 🟨 `[x]` migração com RLS, uma política por operação e grants, testada num Postgres 16 local (banco novo e banco com dados) pelo `scripts/testar-banco.sh`. `[ ]` aplicada no Supabase real (Pedro) |
| 5 | Login e permissões | 🟨 `[x]` tela de login e Supabase Auth no código. `[ ]` testado com Supabase real; `[ ]` cadastro público desligado (Pedro) |
| 6 | Construir o sistema | 🟨 Fase 1 do produto `[x]` (importação, nota, lista). Fases 2, 3 e 4 do produto `[ ]` |
| 7 | Design | 🟨 `[x]` visual Degrau aplicado, um botão principal por tela. `[ ]` `npm run auditoria` (contraste, formatos, nos dois temas) não existe ainda neste projeto; tema escuro `[ ]` dispensado por ora (CRM só claro) |
| 8 | Domínio, e-mail próprio e cabeçalhos | 🟨 `[x]` `_headers` com CSP gerado no build, testado sem violações. `[ ]` domínio próprio; e-mail próprio n/a (CRM não envia e-mail) |
| 9 | LGPD | 🟨 Dados de empresas públicas do Google Maps; mensagens personalizadas, poucas por dia. `[ ]` registrar como o Pedro atende pedido de "não me contate" (campo no lead, Fase 2 do produto) |
| 10 | Qualidade | 🟨 `[x]` `tsc`, `vitest` (8) e `build` passando. `[x]` teste de isolamento da RLS. `[ ]` teste de tela com Playwright salvo no repositório; `[ ]` backup com restauração testada (depende do Supabase) |
| 11 | Go-live | `[ ]` antes de dado real: Supabase com backup, repositório privado, dados de teste apagados |
| 12 | Operação | `[ ]` |

## O que falta o Pedro fazer
1. Criar o projeto no Supabase (região São Paulo) e decidir plano gratuito ou Pro.
2. Colar `supabase/aplicar/01-fase1_prospeccao.sql` no SQL Editor (confirmar "Run and enable RLS") e **me avisar que rodou**.
3. Criar o usuário e desligar o cadastro de novas contas.
4. Deixar o repositório privado antes de ligar dados reais.
5. Criar o app no Cloudflare e colar as duas variáveis `VITE_SUPABASE_*`.

## Histórico (mais recente em cima)
- **16/11 · Alinhamento à skill.** Migração renomeada (`20261116190000_fase1_prospeccao.sql`), com `grant` explícito, política por operação, `revoke` de `anon`, registro em `controle.migracoes` e arquivo `supabase/aplicar/`. Testada em Postgres local: banco novo, banco com dados, reaplicação recusada e teste de isolamento (anônimo, outro usuário, desfazer lote, schema de controle). Provado que a versão antiga, sem grants, dava "permission denied" para o usuário logado. Hospedagem trocada de Pages para Workers estáticos (`wrangler.jsonc`), com CSP em `dist/_headers`, testada sem violações. **Falta:** passos 1 a 5 acima.
- **16/11 · Página de teste.** CRM publicado em modo demonstração no claude.ai (dados só no navegador). Testado: importar, recarregar, desfazer lote, celular sem rolagem lateral.
- **16/11 · Produto, Fase 1.** Importar planilha do Outscraper, nota de oportunidade, descarte de redes, duplicados, lista com funil e filtros. Testado com as 2 planilhas reais (hamburguerias: 16 na fila; pizzarias: 7). Nenhuma planilha real vai para o Git.
