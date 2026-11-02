// Layouts de slide. Cada função recebe (slide, ctx) e devolve o HTML do miolo.
// ctx = { tema, t (cores do tema), formato, i (índice), total }
import { simbolo, simboloContorno, logo, icone, HANDLE } from './marca.mjs';

// Escapa HTML e aplica a marcação simples do post.json:
//   *palavra*  -> palavra-chave em degradê azul
//   \n         -> quebra de linha
export function txt(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*(.+?)\*/g, '<span class="destaque">$1</span>')
    .replace(/\n/g, '<br>');
}

const chapeu = (s) => (s ? `<div class="chapeu">${txt(s)}</div>` : '');
const seta = (cor, t = 28) => icone('seta', t, cor, 2.4);

function vidroItem(texto, ctx) {
  return `<div class="vidro item"><span class="ponto"></span><span>${txt(texto)}</span></div>`;
}

export const LAYOUTS = {
  // Abertura: logo no topo, símbolo vazado ao fundo, título grande, "Arraste".
  capa(s, ctx) {
    const { t, formato } = ctx;
    const grande = Math.round(formato.w * 0.37);
    return `
      <div class="simbolo-fundo" style="width:${grande}px;height:${grande}px">${simboloContorno(grande, t.texto)}</div>
      <div class="col">
        <div>${logo(30, t.texto)}</div>
        <div class="bloco-capa" style="margin-top:auto;margin-bottom:64px">
          ${s.chapeu ? `<div class="kicker">${txt(s.chapeu)}</div>` : ''}
          <h1 class="titulo t-capa na-capa ajusta">${txt(s.titulo)}</h1>
          ${s.subtitulo ? `<p class="apoio">${txt(s.subtitulo)}</p>` : ''}
        </div>
        <div class="linha">
          <span class="handle">${HANDLE}</span>
          ${ctx.total > 1 ? `<span class="pilula">${txt(s.botao || 'Arraste')}${seta('#FFFFFF', 24)}</span>` : ''}
        </div>
      </div>`;
  },

  // Lista de pontos em cartões de vidro (dores, sinais, erros).
  lista(s) {
    return `
      <div class="col" style="gap:56px">
        ${chapeu(s.chapeu)}
        <h2 class="titulo t-grande ajusta">${txt(s.titulo)}</h2>
        <div class="pilha">${(s.itens || []).map((x) => vidroItem(x)).join('')}</div>
        ${s.rodape ? `<p class="apoio" style="margin-top:auto">${txt(s.rodape)}</p>` : ''}
      </div>`;
  },

  // Uma ideia só: título e um parágrafo.
  texto(s) {
    return `
      <div class="col" style="gap:48px;justify-content:${s.centro ? 'center' : 'flex-start'}">
        ${chapeu(s.chapeu)}
        <h2 class="titulo t-grande ajusta">${txt(s.titulo)}</h2>
        ${s.texto ? `<p class="apoio grande">${txt(s.texto)}</p>` : ''}
        ${s.rodape ? `<p class="apoio" style="margin-top:auto">${txt(s.rodape)}</p>` : ''}
      </div>`;
  },

  // Grade 2x2 de cartões com ícone (o último pode ser o cartão escuro com o símbolo).
  grade(s, ctx) {
    const cards = (s.cards || []).map((c, k) => {
      const invertido = c.destaque;
      const cor = invertido ? (ctx.tema === 'claro' ? '#FFFFFF' : '#0E0E10') : ctx.t.texto;
      return `<div class="vidro card ${invertido ? 'card-invertido' : ''}">
        ${icone(c.icone || 'check', 52, cor)}
        <div><div class="card-titulo">${txt(c.titulo)}</div>${c.texto ? `<div class="card-texto">${txt(c.texto)}</div>` : ''}</div>
      </div>`;
    });
    return `
      <div class="col" style="gap:48px">
        ${chapeu(s.chapeu)}
        <h2 class="titulo t-medio ajusta">${txt(s.titulo)}</h2>
        <div class="grade">${cards.join('')}</div>
      </div>`;
  },

  // Antes e depois, lado a lado.
  antesDepois(s, ctx) {
    const coluna = (rotulo, itens, depois) => `
      <div class="vidro ad ${depois ? 'ad-depois' : ''}">
        <div class="ad-rotulo">${txt(rotulo)}</div>
        ${(itens || []).map((x) => `<div class="ad-item">${icone(depois ? 'check' : 'alerta', 34, depois ? '#FFFFFF' : ctx.t.apoio, 2)}<span>${txt(x)}</span></div>`).join('')}
      </div>`;
    return `
      <div class="col" style="gap:48px">
        ${chapeu(s.chapeu)}
        <h2 class="titulo t-medio ajusta">${txt(s.titulo)}</h2>
        <div class="ad-grade">
          ${coluna(s.rotuloAntes || 'Antes', s.antes, false)}
          ${coluna(s.rotuloDepois || 'Depois', s.depois, true)}
        </div>
        ${s.rodape ? `<p class="apoio" style="margin-top:auto">${txt(s.rodape)}</p>` : ''}
      </div>`;
  },

  // Passos ou sinais em degraus crescentes (o último é o mais escuro).
  degraus(s, ctx) {
    const itens = s.itens || [];
    const n = itens.length;
    const tons = ctx.tema === 'claro'
      ? ['#E6E6E8', '#3A3A40', '#0E0E10']
      : ['rgba(255,255,255,.08)', 'rgba(255,255,255,.16)', '#1E3F73'];
    const linhas = itens.map((x, k) => {
      const recuo = (n - 1 - k) * 120;
      const tom = tons[Math.min(tons.length - 1, Math.round((k / Math.max(1, n - 1)) * (tons.length - 1)))];
      const claroTexto = ctx.tema === 'escuro' || k > 0 && tom !== '#E6E6E8';
      return `<div class="degrau" style="margin-right:${recuo}px;background:${tom};color:${claroTexto ? '#FFFFFF' : '#0E0E10'}${ctx.tema === 'escuro' && k === n - 1 ? ';border:1.5px solid #4A6EA8' : ''}">
        <span class="degrau-num">${k + 1}</span><span>${txt(x)}</span></div>`;
    });
    return `
      <div class="col" style="gap:56px">
        ${chapeu(s.chapeu)}
        <h2 class="titulo t-grande ajusta">${txt(s.titulo)}</h2>
        <div class="pilha" style="margin-top:auto">${linhas.join('')}</div>
        ${s.botao ? `<div class="botao-bloco">${txt(s.botao)}</div>` : ''}
      </div>`;
  },

  // Número ou dado em destaque (só números reais!).
  numero(s) {
    return `
      <div class="col" style="gap:40px;justify-content:center">
        ${chapeu(s.chapeu)}
        <div class="numero ajusta"><span class="destaque">${txt(s.numero)}</span></div>
        <h2 class="titulo t-medio">${txt(s.titulo)}</h2>
        ${s.texto ? `<p class="apoio grande">${txt(s.texto)}</p>` : ''}
      </div>`;
  },

  // Fechamento com a chamada padrão ("DOR" no direct).
  chamada(s, ctx) {
    const { t } = ctx;
    return `
      <div class="degraus-deco" aria-hidden="true">
        <div style="height:120px"></div><div style="height:200px"></div><div class="alto" style="height:280px"></div>
      </div>
      <div class="col" style="justify-content:space-between">
        <div>${simbolo(48, t.simbolo)}</div>
        <div>
          <h2 class="titulo t-capa ajusta">${txt(s.titulo || 'Sua rotina,\num degrau\n*acima.*')}</h2>
          ${s.texto ? `<p class="apoio" style="margin-top:34px;max-width:660px">${txt(s.texto)}</p>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:22px;align-items:flex-start">
          <span class="pilula grande">${txt(s.botao || 'Mande "DOR" no direct')}${seta('#FFFFFF', 28)}</span>
          <span class="handle grande">${txt(s.rodape || `Siga ${HANDLE} para acompanhar`)}</span>
        </div>
      </div>`;
  },
};

export const TIPOS = Object.keys(LAYOUTS);
