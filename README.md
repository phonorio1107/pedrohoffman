# Sistema Pedro Hoffman

Central da marca: o que postar, quando, com que cara, e a rotina por trás.
Tudo em texto simples (Markdown) para o Claude ler e escrever junto com você.

> Sua rotina, um degrau acima. Começando pela minha.

## Mapa

| Pasta | Para quê | Arquivo principal |
|---|---|---|
| `marca/` | Voz, tom e regras visuais resumidas | `voz.md`, `visual.md` |
| `conteudo/` | Estratégia, calendário, ideias e cada post | `estrategia.md`, `calendario/2026-11.md`, `ideias.md` |
| `conteudo/posts/` | Uma pasta por peça (arte, vídeo, legenda) | `post.json`, `video.json`, `legenda.md` |
| `rotina/` | Semana padrão, demandas e automações | `semana.md`, `demandas.md`, `automacoes.md` |
| `motor/` | Gera carrosséis, stories e Reels no visual Degrau | `motor/README.md` |

## Como usar no dia a dia

Peça ao Claude, em português normal:

- **"Planeja minha semana de conteúdo"** → ele lê estratégia, ideias e calendário e propõe a semana.
- **"Cria o carrossel sobre [tema]"** → ele escreve o `post.json`, gera as artes e o PDF do LinkedIn.
- **"Roteiro de Reels sobre [tema]"** → roteiro de narração + `video.json` + prévia do vídeo.
- **"Ideia nova: [ideia]"** → vai para `conteudo/ideias.md` no pilar certo.
- **"Novo lead: [nome, dor]"** → entra em `rotina/demandas.md`.

## Motor (resumo)

```bash
cd motor && npm install
```

```bash
npm run arte -- ../conteudo/posts/2026-11-s2-carrossel-planilha/post.json
```

```bash
npm run video -- ../conteudo/posts/2026-11-s1-reels-3-sinais/video.json
```

Detalhes, tipos de slide e cenas em [`motor/README.md`](motor/README.md).

## Fontes da verdade

- Quem é a marca: skill `pedro-hoffman`.
- Visual: design system "Pedro Hoffman Degrau" e canvas "kit Degrau" (claude.ai). O motor copia essas regras; se mudar lá, mude em `motor/carrossel/marca.mjs` e `motor/video/marca.tsx`.
