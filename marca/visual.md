# Visual (resumo do kit Degrau)

Fonte completa: design system **Pedro Hoffman Degrau** e canvas **Marca Pedro Hoffman: kit Degrau** (claude.ai). Este arquivo é o resumo que o motor segue.

## Cores

| Nome | Hex | Uso |
|---|---|---|
| tinta | `#0E0E10` | Fundo escuro, logo, títulos |
| papel | `#FFFFFF` | Fundo claro |
| grafite | `#3A3A40` | Texto de apoio no claro |
| névoa | `#E6E6E8` | Bordas, painéis |
| marinho | `#0B1F3A` | Só botões, chamadas e detalhes |
| marinho claro | `#1E3F73` (borda `#4A6EA8`) | Botão no fundo escuro |

Proporção: papel 60% · tinta 25% · névoa 10% · marinho 5%.

### Degradê azul (só nas peças de comunicação)
| Nome | Hex | Uso |
|---|---|---|
| azul-brilho | `#4A7BD0` | Fim do degradê no claro e brilho dos cantos |
| azul-gelo | `#C9DAF6` | Meio do degradê no escuro |
| azul-céu | `#6F9BE8` | Fim do degradê no escuro |

- Palavra-chave do título, uma por título: no claro `#1E3F73 → #4A7BD0`; no escuro `#FFFFFF → #C9DAF6 → #6F9BE8`.
- Brilho marinho suave nos cantos dos posts.
- Nunca no logo, em botões, em texto corrido ou na interface dos sistemas dos clientes.

## Tipografia
- **Inter Tight** nos títulos e no logo ("Pedro" 500, "Hoffman" 700), espaçamento negativo.
- **Inter** no texto.

## Redes
- Fundos alternando preto e branco entre slides.
- Brilho marinho suave nos cantos, que atravessa de um slide para o outro.
- Vidro sutil nos cartões.
- Palavra-chave do título em degradê azul (no `post.json`: `*palavra*`).
- Sem numeração de páginas, sem barrinhas ligando slides, sem emoji nas artes.
- Margem de 96 px no feed. Story e Reels: 250 px livres no topo e 340 px embaixo.

## Logo
Arquivos prontos (SVG, nome em curvas) em `marca/logos/`; favicon, ícone de app e foto de perfil em `marca/icones/`.
- Sempre tinta, papel, ou branco sobre marinho. Nunca colorido.
- Usuário da marca nas peças: `@pedrohoffman.ia`.
- Não igualar as colunas, não espelhar, não esticar, sem sombra nem degradê.

## Medidas
| Peça | Medida |
|---|---|
| Feed Instagram / post LinkedIn | 1080 × 1350 |
| Story e Reels | 1080 × 1920 |
| Capa do Reels na grade | corte central 1080 × 1350 |
| LinkedIn documento (carrossel) | PDF 1080 × 1350 (o motor gera) |
