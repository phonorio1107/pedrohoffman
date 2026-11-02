#!/usr/bin/env node
// Motor de artes da Pedro Hoffman.
// Lê um post.json e gera os PNGs (1080x1350 feed ou 1080x1920 story)
// e, no feed, um PDF pronto para carrossel de documento no LinkedIn.
//
// Uso (dentro de motor/):
//   npm run arte -- ../conteudo/posts/<pasta>/post.json
//   npm run arte -- ../conteudo/posts/<pasta>/post.json --so 3   (só o slide 3)

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { TEMA, FORMATO } from './marca.mjs';
import { LAYOUTS, TIPOS } from './layouts.mjs';

const require = createRequire(import.meta.url);

function fonte(pacote, familia, peso) {
  const dir = path.dirname(require.resolve(`${pacote}/package.json`));
  const nome = pacote.split('/')[1];
  const arquivo = pathToFileURL(path.join(dir, 'files', `${nome}-latin-${peso}-normal.woff2`)).href;
  return `@font-face{font-family:'${familia}';font-weight:${peso};font-style:normal;src:url('${arquivo}') format('woff2')}`;
}

const FONTES = [
  ...[400, 500, 600].map((p) => fonte('@fontsource/inter', 'Inter', p)),
  ...[500, 600, 700].map((p) => fonte('@fontsource/inter-tight', 'Inter Tight', p)),
].join('\n');

function css(t, f) {
  return `
${FONTES}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:${t.fundo}}
.slide{position:relative;width:${f.w}px;height:${f.h}px;overflow:hidden;background:${t.fundo};color:${t.texto};font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.faixa{position:absolute;top:0;height:${f.h}px}
.brilho{position:absolute;width:900px;height:900px;border-radius:50%;background:${t.brilho}}
.conteudo{position:absolute;top:${f.margem[0]}px;right:${f.margem[1]}px;bottom:${f.margem[2]}px;left:${f.margem[3]}px;display:flex}
.col{display:flex;flex-direction:column;width:100%;height:100%;position:relative}
.logo{display:flex;align-items:center;gap:14px}
.logo span{font-family:'Inter Tight',sans-serif;letter-spacing:-.04em;line-height:1}
.logo .p{font-weight:500}.logo .h{font-weight:700}
.chapeu{font-size:22px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:${t.chapeu}}
.kicker{font-family:'Inter Tight',sans-serif;font-size:48px;font-weight:500;letter-spacing:-.03em;color:${t.apoio};margin-bottom:8px}
.titulo{margin:0;font-family:'Inter Tight',sans-serif;font-weight:700;overflow-wrap:break-word}
.t-capa{font-size:124px;line-height:.94;letter-spacing:-.055em}
.t-grande{font-size:100px;line-height:.98;letter-spacing:-.05em}
.t-medio{font-size:84px;line-height:1;letter-spacing:-.045em}
.destaque{background:${t.destaque};-webkit-background-clip:text;background-clip:text;color:transparent}
.apoio{margin:0;font-size:32px;line-height:44px;color:${t.apoio};max-width:780px}
.apoio.grande{font-size:38px;line-height:52px;max-width:860px}
.bloco-capa .apoio{margin-top:30px;font-size:31px;max-width:720px}
.linha{display:flex;justify-content:space-between;align-items:center}
.handle{font-size:24px;color:${t.handle}}
.handle.grande{font-size:27px}
.pilula{display:inline-flex;align-items:center;gap:12px;min-height:64px;padding:0 30px;border-radius:999px;background:#0B1F3A;border:1.5px solid ${t === TEMA.escuro ? '#4A6EA8' : '#0B1F3A'};color:#FFFFFF;font-size:24px;font-weight:600}
.pilula.grande{min-height:84px;padding:0 40px;gap:14px;font-size:31px;background:linear-gradient(90deg,#1E3F73,#4A7BD0);border-color:rgba(201,218,246,.45)}
.vidro{background:${t.vidro};border:1.5px solid ${t.vidroBorda};backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px)}
.pilha{display:flex;flex-direction:column;gap:18px}
.item{display:flex;align-items:center;gap:26px;padding:32px 36px;border-radius:28px;font-size:36px;line-height:46px;font-weight:500}
.ponto{width:14px;height:14px;border-radius:50%;background:${t.ponto};flex-shrink:0}
.grade{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;flex-grow:1}
.card{border-radius:28px;padding:34px;display:flex;flex-direction:column;justify-content:space-between;gap:24px}
.card-invertido{background:${t.texto};color:${t.fundo};border-color:${t.texto}}
.card-titulo{font-family:'Inter Tight',sans-serif;font-size:38px;font-weight:700;letter-spacing:-.03em;line-height:1.1}
.card-texto{font-size:25px;line-height:35px;color:${t.apoio};margin-top:8px}
.card-invertido .card-texto{color:${t === TEMA.escuro ? '#3A3A40' : '#C3CAD6'}}
.ad-grade{display:grid;grid-template-columns:1fr 1fr;gap:18px;flex-grow:1}
.ad{border-radius:28px;padding:36px 32px;display:flex;flex-direction:column;gap:26px}
.ad-depois{background:linear-gradient(160deg,#1E3F73,#0B1F3A);border-color:#4A6EA8;color:#FFFFFF}
.ad-rotulo{font-size:22px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:${t.chapeu}}
.ad-depois .ad-rotulo{color:#A9C1EA}
.ad-item{display:flex;gap:16px;align-items:flex-start;font-size:30px;line-height:40px;font-weight:500}
.ad-item svg{flex-shrink:0;margin-top:3px}
.degrau{border-radius:24px;padding:32px 36px;display:flex;gap:24px;align-items:baseline;font-size:36px;line-height:46px;font-weight:500}
.degrau-num{font-family:'Inter Tight',sans-serif;font-size:56px;font-weight:700;letter-spacing:-.04em}
.botao-bloco{display:flex;align-items:center;justify-content:center;min-height:104px;border-radius:24px;background:#0B1F3A;color:#FFFFFF;font-size:36px;font-weight:600;${t === TEMA.escuro ? 'border:1.5px solid #4A6EA8;' : ''}}
.numero{font-family:'Inter Tight',sans-serif;font-size:260px;line-height:.9;font-weight:700;letter-spacing:-.06em}
.simbolo-fundo{position:absolute;right:40px;top:150px}
.t-capa.na-capa{font-size:112px}
.degraus-deco{position:absolute;right:0;top:${f.h > 1500 ? 420 : 250}px;display:flex;align-items:flex-end;gap:14px}
.degraus-deco div{width:96px;border-radius:20px;background:linear-gradient(140deg,rgba(255,255,255,.12),rgba(255,255,255,.03));border:1.5px solid rgba(255,255,255,.2)}
.degraus-deco .alto{border-radius:20px 0 0 20px;border-right:0;background:linear-gradient(140deg,rgba(130,170,240,.75),rgba(30,63,115,.45));border-color:rgba(201,218,246,.5)}
`;
}

// Brilhos marinho numa faixa contínua: atravessam a borda entre um slide e o próximo.
function faixa(i, total, f) {
  const brilhos = [];
  for (let j = 0; j < total; j++) {
    const x = j * f.w + Math.round(f.w * 0.583);
    const y = j % 2 === 0 ? Math.round(f.h * 0.6) : -360;
    brilhos.push(`<div class="brilho" style="left:${x}px;top:${y}px"></div>`);
  }
  return `<div class="faixa" aria-hidden="true" style="left:${-i * f.w}px;width:${total * f.w}px">${brilhos.join('')}</div>`;
}

// Fundo: o que o slide pedir; senão capa e chamada escuras e o resto alternando.
function temas(slides) {
  let anterior = null;
  return slides.map((s) => {
    let tema = s.fundo;
    if (!tema) {
      if (s.tipo === 'capa' || s.tipo === 'chamada') tema = 'escuro';
      else tema = anterior === 'claro' ? 'escuro' : 'claro';
    }
    anterior = tema;
    return tema;
  });
}

function avisarRepeticao(lista) {
  for (let i = 1; i < lista.length; i++) {
    if (lista[i] === lista[i - 1]) {
      console.warn(`⚠ slides ${i} e ${i + 1} ficaram com o mesmo fundo (${lista[i]}). Prefira 5 ou 7 slides, ou defina "fundo" em algum.`);
    }
  }
}

function pagina(slide, ctx) {
  const layout = LAYOUTS[slide.tipo];
  if (!layout) throw new Error(`Tipo de slide "${slide.tipo}" não existe. Use: ${TIPOS.join(', ')}`);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${css(ctx.t, ctx.formato)}</style></head>
<body><div class="slide">${faixa(ctx.i, ctx.total, ctx.formato)}<div class="conteudo">${layout(slide, ctx)}</div></div></body></html>`;
}

// Diminui títulos marcados com .ajusta até o conteúdo caber (texto longo não estoura).
async function ajustarTexto(page) {
  return page.evaluate(() => {
    const col = document.querySelector('.conteudo > .col');
    const alvos = [...document.querySelectorAll('.ajusta')];
    const avisos = [];
    for (const el of alvos) {
      let tam = parseFloat(getComputedStyle(el).fontSize);
      const min = tam * 0.6;
      const estoura = () => col.scrollHeight > col.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
      while (estoura() && tam > min) {
        tam *= 0.96;
        el.style.fontSize = `${tam}px`;
      }
      if (estoura()) avisos.push('texto não coube nem com fonte reduzida: encurte o slide');
    }
    return avisos;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const arquivo = args.find((a) => !a.startsWith('--'));
  if (!arquivo) {
    console.error('Uso: npm run arte -- caminho/do/post.json [--so N]');
    process.exit(1);
  }
  const so = args.includes('--so') ? Number(args[args.indexOf('--so') + 1]) : null;
  const post = JSON.parse(await readFile(arquivo, 'utf8'));
  const formato = FORMATO[post.formato || 'feed'];
  if (!formato) throw new Error(`formato "${post.formato}" inválido (use feed ou story)`);

  const dir = path.join(path.dirname(path.resolve(arquivo)), post.formato === 'story' ? 'story' : 'png');
  await mkdir(dir, { recursive: true });

  const lista = temas(post.slides);
  avisarRepeticao(lista);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: formato.w, height: formato.h } });
  const gerados = [];

  for (let i = 0; i < post.slides.length; i++) {
    if (so && so !== i + 1) continue;
    const tema = lista[i];
    const ctx = { tema, t: TEMA[tema], formato, i, total: post.slides.length };
    const html = pagina(post.slides[i], ctx);
    const tmp = path.join(dir, `.tmp-${i}.html`);
    await writeFile(tmp, html);
    await page.goto(pathToFileURL(tmp).href);
    await page.evaluate(() => document.fonts.ready);
    const avisos = await ajustarTexto(page);
    const saida = path.join(dir, `${String(i + 1).padStart(2, '0')}.png`);
    await page.locator('.slide').screenshot({ path: saida });
    await rm(tmp);
    gerados.push(saida);
    console.log(`✓ ${path.relative(process.cwd(), saida)}  (${post.slides[i].tipo}, ${tema})${avisos.length ? '  ⚠ ' + avisos[0] : ''}`);
  }

  // PDF para o LinkedIn (carrossel de documento), feito dos próprios PNGs.
  if ((post.formato || 'feed') === 'feed' && !so) {
    const imgs = gerados.map((g) => `<img src="${pathToFileURL(g).href}">`).join('');
    const tmp = path.join(dir, '.tmp-pdf.html');
    await writeFile(tmp, `<!doctype html><html><head><style>@page{size:${formato.w}px ${formato.h}px;margin:0}body{margin:0}img{display:block;width:${formato.w}px;height:${formato.h}px;page-break-after:always}</style></head><body>${imgs}</body></html>`);
    await page.goto(pathToFileURL(tmp).href);
    const pdf = path.join(path.dirname(dir), 'linkedin.pdf');
    await page.pdf({ path: pdf, width: `${formato.w}px`, height: `${formato.h}px`, printBackground: true });
    await rm(tmp);
    console.log(`✓ ${path.relative(process.cwd(), pdf)}  (LinkedIn)`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
