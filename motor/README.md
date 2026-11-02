# Motor de conteúdo

Gera artes e vídeos já no visual Degrau. Você (ou o Claude) escreve **o que dizer** em um arquivo JSON; o motor cuida de **como fica**.

## Instalar (uma vez)

```bash
cd motor
npm install
npx playwright install chromium
```

No ambiente de nuvem do Claude o navegador já vem instalado; o último comando é só para o seu computador.

---

## 1. Artes: carrossel e story

```bash
npm run arte -- ../conteudo/posts/<pasta>/post.json
```

Saída na pasta do post: `png/01.png`, `png/02.png`... e `linkedin.pdf` (feed) ou `story/01.png` (story).
Para refazer só um slide: `--so 3`.

### post.json

```json
{
  "formato": "feed",
  "slides": [
    { "tipo": "capa", "chapeu": "Planilhas", "titulo": "A planilha que *só você* entende.", "subtitulo": "..." },
    { "tipo": "chamada", "texto": "Qual planilha mais toma o seu tempo hoje?" }
  ]
}
```

- `formato`: `feed` (1080 × 1350) ou `story` (1080 × 1920).
- `*palavra*` = palavra-chave em degradê azul. `\n` = quebra de linha.
- `fundo`: `claro` ou `escuro` (opcional). Sem ele: capa e chamada escuras, o resto alterna. Use 5 ou 7 slides.
- Título longo diminui sozinho; se nem assim couber, o motor avisa com ⚠.

### Tipos de slide

| Tipo | Campos | Uso |
|---|---|---|
| `capa` | `chapeu`, `titulo`, `subtitulo`, `botao` | Abertura com logo e símbolo vazado |
| `lista` | `chapeu`, `titulo`, `itens[]`, `rodape` | Dores, sinais, erros (cartões de vidro) |
| `texto` | `chapeu`, `titulo`, `texto`, `rodape`, `centro` | Uma ideia só |
| `degraus` | `chapeu`, `titulo`, `itens[]`, `botao` | 3 passos ou sinais crescentes |
| `antesDepois` | `chapeu`, `titulo`, `antes[]`, `depois[]`, `rotuloAntes`, `rotuloDepois` | A virada |
| `grade` | `chapeu`, `titulo`, `cards[{icone, titulo, texto, destaque}]` | 4 cartões com ícone |
| `numero` | `chapeu`, `numero`, `titulo`, `texto` | Um dado em destaque (só número real) |
| `chamada` | `titulo`, `texto`, `botao`, `rodape` | Fechamento com "DOR" no direct |

Ícones: `planilha`, `grafico`, `codigo`, `relogio`, `mensagem`, `check`, `alerta`, `pasta`, `calendario`, `dinheiro`, `estoque`, `automacao`, `pessoa`, `lupa`, `cadeado`, `seta`, `simbolo`.

---

## 2. Vídeo: Reels

```bash
npm run video -- ../conteudo/posts/<pasta>/video.json             # reels.mp4
npm run video -- ../conteudo/posts/<pasta>/video.json --quadro 90  # prévia de um quadro (PNG)
npm run video -- --vinheta                                         # só a vinheta do símbolo
npm run video:estudio                                              # editor visual no navegador
```

Mídias (gravação de tela, narração, trilha) ficam **na mesma pasta** do `video.json`.

### video.json

```json
{
  "cenas": [
    { "tipo": "gancho", "duracao": 2.5, "chapeu": "3 sinais", "titulo": "Sua empresa já pede um *sistema?*" },
    { "tipo": "tela", "duracao": 5, "titulo": "O mesmo controle, *num painel.*", "arquivo": "tela.mp4", "inicio": 2 },
    { "tipo": "chamada", "duracao": 4, "texto": "Qual tarefa mais toma o seu tempo hoje?" },
    { "tipo": "vinheta", "duracao": 2.5 }
  ],
  "legendas": [{ "de": 0.2, "ate": 2.4, "texto": "Três sinais de que..." }],
  "narracao": "narracao.m4a",
  "trilha": "trilha.mp3",
  "volumeTrilha": 0.12
}
```

| Cena | Campos | O que faz |
|---|---|---|
| `gancho` | `chapeu`, `titulo` | Frase forte, fundo escuro |
| `texto` | `chapeu`, `titulo`, `texto` | Uma ideia |
| `lista` | `chapeu`, `titulo`, `itens[]` | Itens sobem um a um |
| `tela` | `titulo`, `arquivo`, `inicio`, `mudo` | Gravação de tela em moldura de vidro, zoom lento. Sem `arquivo`, mostra um espaço reservado |
| `chamada` | `titulo`, `texto`, `botao` | Logo + "Sua rotina, um degrau acima." + botão DOR |
| `vinheta` | — | Símbolo Degrau se montando + nome |

Tudo em 1080 × 1920, 30 fps, respeitando 250 px no topo e 340 px embaixo. Entradas animadas "em degrau" (sobem e aparecem), brilho marinho se movendo devagar.

Trilha: use só música livre de direitos (biblioteca do YouTube, do próprio Instagram na hora de postar, etc.).

---

## Onde mexer no visual
- Artes: `carrossel/marca.mjs` (cores, símbolo, ícones), `carrossel/layouts.mjs` (tipos de slide), `carrossel/render.mjs` (CSS).
- Vídeo: `video/marca.tsx` (cores e peças), `video/Reels.tsx` (cenas), `video/Vinheta.tsx`.
- Mantenha as cores iguais nos dois e iguais ao design system Degrau.

## Licenças
Remotion é gratuito para pessoa física e empresas de até 3 pessoas (confira em remotion.dev/license ao crescer). Inter e Inter Tight: licença OFL, livres.
