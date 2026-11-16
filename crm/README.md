# CRM Pedro Hoffman

Sistema interno de prospecção e carteira. Só o Pedro usa.

- **Prospecção:** importar planilhas do Google Maps (Outscraper), dar uma nota de oportunidade a cada empresa e trabalhar a fila.
- **Carteira** (Fase 3): contratos, pagamentos, infraestrutura e alertas dos clientes.

Design aprovado: canvas "Sistema Pedro Hoffman" no claude.ai. Visual: design system "Pedro Hoffman Degrau".

## Status das fases

| Fase | O quê | Status |
|---|---|---|
| 1 | Projeto, banco com RLS, login, importação, nota de oportunidade, lista de leads com filtros | ✅ pronta |
| 2 | Ficha do lead, modelos de mensagem, WhatsApp, histórico | ✅ entrega 1 |
| 2 | Fila Hoje e versão para celular | ✅ entrega 2 |
| 3 | Carteira, ficha do cliente, contratos, pagamentos, ajustes, marcos, alertas | ⬜ |
| 4 | Monitor dos sites dos clientes (Worker com cron), avisos de SSL e domínio | ⬜ |

## Rodar no computador

```bash
cd crm
npm install
npm run dev
```

Abre em http://localhost:5173. **Sem o `.env`, abre em modo demonstração**: tudo fica só no navegador, ótimo para testar uma planilha.

```bash
npm test                      # regras de importação e da nota
npm run build                 # confere os tipos e gera dist/
./scripts/testar-banco.sh     # Postgres local: migração, isolamento (RLS) e prova de que o schema public não muda
./scripts/gerar-aplicar.sh    # gera o SQL para colar no Supabase (supabase/aplicar/)
```

## Testar sem instalar nada

O CRM está publicado como página privada no claude.ai, em modo demonstração: https://claude.ai/artifact/DXDXtXK2N8wCkNhccwzVr3
Os dados ficam só no navegador de quem abre (não vão para o Git nem para o Claude). Para gerar de novo a página única depois de mudar o código: `npm run build:pagina`.

## Ligar ao Supabase (uma vez)

O CRM guarda tudo no schema `crm`, separado do `public`. Dá para usar um projeto Supabase só dele ou um que já exista (como o Hub): o SQL só cria coisas novas dentro de `crm` e não mexe em nada do `public`.

1. **Antes, se for um projeto com dados seus (Hub):** exporte uma cópia das tabelas principais em CSV. O plano gratuito não faz backup.
2. **SQL Editor > New query**: cole o conteúdo de `supabase/aplicar/01-fase1_prospeccao.sql`, depois o de `02-fase2_modelos_mensagem.sql` (um de cada vez, nessa ordem), e clique em **Run**. Rodar duas vezes é recusado de propósito.
3. **Project Settings > API > Exposed schemas**: adicione `crm` e salve. Sem isso o app recebe "schema not found".
4. **Authentication > Users**: use o seu usuário (ou crie um, marcando "Auto Confirm User"). **Confira que não há outros usuários**: quem tem login poderia gravar leads no CRM.
5. **Authentication > Sign In / Providers**: desligue "Allow new users to sign up" (se ainda estiver ligado).
6. **Project Settings > API**: copie o **Project URL** e a chave **anon/publishable** para um `.env` (modelo em `.env.example`). Nunca use a chave `service_role` ou `secret`.
7. `npm run dev`: agora pede login e grava no Supabase.

A chave `anon` é pública por natureza; quem protege os dados é a RLS (cada linha só aparece para o dono).

## Publicar no Cloudflare (Workers com arquivos estáticos)

Padrão dos sistemas da marca: Workers com arquivos estáticos, não Pages. O `wrangler.jsonc` já está pronto (`assets.directory: ./dist` e `not_found_handling: single-page-application`, que dispensa `_redirects`). O build gera `dist/_headers` com a política de segurança (CSP).

1. Cloudflare > Workers & Pages > Create > **Import a repository** (Workers) > escolha este repositório.
2. **Root directory:** `crm` · **Build command:** `npm run build` · **Deploy command:** `npx wrangler deploy` · branch: `main`.
3. Em **Variables and secrets (build)**, as mesmas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Como a importação funciona

1. **Arquivo:** CSV ou Excel (.xlsx). No Outscraper, use só o "Raspador do Google Maps", **sem pacote de enriquecimento**: o enriquecimento repete a mesma empresa uma vez por contato e traz e-mails da plataforma de cardápio, não da loja.
2. **Colunas:** reconhece sozinho os nomes do Outscraper (`name`, `phone`, `website`, `county`, `rating`, `reviews`, `place_id`...). Dá para corrigir na tela.
3. **Revisão:** mostra novos, já existentes, sem contato e descartados antes de gravar.

Regras:
- **Duplicado:** mesmo `place_id` do Google, mesmo link do Maps, ou mesmo telefone com o mesmo nome. Duplicado atualiza os dados e mantém status e histórico.
- **Rede ou franquia:** descartada (marca conhecida, ou mesmo nome ou mesmo site em dois endereços).
- **Fechado no Google:** descartado.
- **Sem telefone e sem e-mail:** entra como "Sem contato", fora da fila.
- **E-mail:** só vale se for do próprio site da empresa, ou gmail/hotmail etc. quando o site é próprio ou não existe.
- **Desfazer lote:** até 7 dias, apaga os leads que nasceram naquele lote.

### Nota de oportunidade (0 a 100)

| Motivo | Pontos |
|---|---|
| Sem site | +35 |
| Só Instagram/Facebook, só iFood ou plataforma de cardápio (Cardápio Web, MenuDino, Brendi, Linktree...) | +27 |
| Nota no Google 4,5 ou mais | +20 |
| 500 ou mais avaliações | +15 |
| Celular (WhatsApp provável) | +15 |
| E-mail confiável | +15 |

Faixas: **Alta ≥ 65**, Média 45 a 64, Baixa < 45. (Sem e-mail o máximo é 85; por isso Alta começa em 65.)
Regras em `src/lib/nota.ts`; listas de plataformas em `src/lib/presenca.ts`; marcas de rede em `src/lib/redes.ts`.

## Cuidados

- **Planilhas de leads nunca entram no Git** (`*.csv` e `*.xlsx` estão no `.gitignore`). Os testes usam só `src/lib/__fixtures__/exemplo-outscraper.csv`, com empresas inventadas.
- Chaves só no `.env`, nunca no código.
- Este repositório ainda é público: deixe privado antes de ligar o CRM a dados reais.
