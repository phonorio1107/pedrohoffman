# CRM Pedro Hoffman

Sistema interno de prospecção e carteira. Só o Pedro usa.

- **Prospecção:** importar planilhas do Google Maps (Outscraper), dar uma nota de oportunidade a cada empresa e trabalhar a fila.
- **Carteira** (Fase 3): contratos, pagamentos, infraestrutura e alertas dos clientes.

Design aprovado: canvas "Sistema Pedro Hoffman" no claude.ai. Visual: design system "Pedro Hoffman Degrau".

## Status das fases

| Fase | O quê | Status |
|---|---|---|
| 1 | Projeto, banco com RLS, login, importação, nota de oportunidade, lista de leads com filtros | ✅ pronta |
| 2 | Ficha do lead, modelos de mensagem, WhatsApp, histórico, fila Hoje, celular | ⬜ |
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
npm test        # regras de importação e da nota
npm run build   # confere os tipos e gera dist/
```

## Ligar ao Supabase (uma vez)

1. Crie um projeto em supabase.com (região São Paulo).
2. **SQL Editor > New query**: cole `supabase/migrations/0001_fase1_prospeccao.sql` e clique em **Run**.
3. **Authentication > Users > Add user**: crie o seu usuário com e-mail e senha (marque "Auto Confirm User").
4. **Authentication > Sign In / Providers**: desligue "Allow new users to sign up". Assim ninguém mais cria conta.
5. **Project Settings > API**: copie a URL e a chave `anon` para um arquivo `.env` (modelo em `.env.example`).
6. `npm run dev` de novo: agora pede login e grava no Supabase.

A chave `anon` é pública por natureza; quem protege os dados é a RLS (cada linha só aparece para o dono). Nunca coloque a chave `service_role` no `.env` do app.

## Publicar no Cloudflare Pages

1. Cloudflare > Workers & Pages > Create > Pages > conectar o repositório.
2. **Root directory:** `crm` · **Build command:** `npm run build` · **Output:** `dist`.
3. Em **Environment variables**, as mesmas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Para as rotas funcionarem ao recarregar a página, o arquivo `public/_redirects` já manda tudo para o `index.html`.

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
