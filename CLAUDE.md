# Instruções para o Claude neste repositório

Este é o sistema da marca Pedro Hoffman: conteúdo, rotina e o motor de artes e vídeos.
Fale sempre em português do Brasil.

## Antes de qualquer coisa

1. Carregue a skill `pedro-hoffman` (quem é a marca, voz, preços, canais).
2. **Nada pessoal ou [PRIVADO] entra aqui**: família, finanças, cidadania, nomes de empregador ou clientes sem autorização. Este repositório pode ser compartilhado.
3. Visual: siga `marca/visual.md`. Não invente outro visual.
4. Sugira 2 ou 3 opções com uma recomendação e o motivo. O Pedro decide.
5. Ele tende ao perfeccionismo: proponha o próximo passo concreto e um prazo. "Feito e bom" vence "perfeito e parado".

## Fluxos

### "Planeja a semana"
1. Leia `conteudo/estrategia.md`, `conteudo/calendario/<mês>.md` e `conteudo/ideias.md`.
2. Proponha: 1 carrossel (terça), 1 Reels (quinta), stories de seg a sex, 1 aparição de rosto (até 30 s).
3. Respeite o equilíbrio de pilares do mês (dor, solução, prova, Pedro) e datas do calendário.
4. Depois do "ok", escreva no calendário e marque as ideias usadas em `ideias.md`.

### "Cria o carrossel sobre X"
1. Pasta `conteudo/posts/AAAA-MM-sN-carrossel-<slug>/` (N = semana do mês).
2. Escreva `post.json` (tipos de slide em `motor/README.md`). **5 ou 7 slides** para os fundos alternarem certinho. Capa primeiro, `chamada` por último.
3. Escreva `legenda.md` seguindo `conteudo/modelos/legenda.md`.
4. Rode `cd motor && npm run arte -- ../conteudo/posts/<pasta>/post.json`, monte uma folha de contato dos PNGs e confira antes de mostrar. O avisos "⚠" do motor significam texto longo demais: encurte.

### "Roteiro de Reels sobre X"
1. Pasta `conteudo/posts/AAAA-MM-sN-reels-<slug>/`.
2. `roteiro.md` (modelo em `conteudo/modelos/reels.md`): gancho de até 3 s, dor, solução na tela, chamada.
3. `video.json` com as cenas e as legendas sincronizadas com a narração.
4. Prévia: `npm run video -- <video.json> --quadro 60`. Vídeo final: sem `--quadro`.
5. Gravação de tela, narração e trilha ficam na mesma pasta do `video.json`.

### "Novo lead" / "demanda"
Atualize `rotina/demandas.md`. Lead vem com: data, como chegou, dor em uma frase, próximo passo, prazo.

## Escrita (resumo da voz)
- Frases curtas, verbo de ação, a dor antes da tecnologia.
- Números reais ou nenhum. Nada de "resultado garantido", "disruptivo", "IA de ponta".
- IA aparece implícita: "ferramentas modernas por trás, simplicidade na sua frente".
- Sem emoji nas artes. Na legenda, no máximo um, e só se ajudar.
- Chamada padrão: mandar "DOR" no direct.

## Motor
- `motor/carrossel/`: post.json → PNG (feed 1080×1350 ou story 1080×1920) + PDF do LinkedIn.
- `motor/video/`: Remotion. video.json → reels.mp4 (1080×1920, 30 fps).
- Cores e símbolo: `motor/carrossel/marca.mjs` e `motor/video/marca.tsx` (manter iguais).
- Em ambiente de nuvem, o motor encontra o Chromium em `/opt/pw-browsers` sozinho.
