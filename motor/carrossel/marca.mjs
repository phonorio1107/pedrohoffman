// Peças da identidade Degrau usadas pelo motor (carrossel, story e capa de Reels).
// Fonte da verdade: design system "Pedro Hoffman Degrau" e canvas "kit Degrau".
// Se algo mudar lá, mude aqui também.

export const COR = {
  tinta: '#0E0E10',
  grafite: '#3A3A40',
  nevoa: '#E6E6E8',
  papel: '#FFFFFF',
  marinho: '#0B1F3A',
  marinhoClaro: '#1E3F73',
  marinhoBorda: '#4A6EA8',
  azulBrilho: '#4A7BD0',
};

export const TEMA = {
  claro: {
    fundo: COR.papel,
    texto: COR.tinta,
    apoio: COR.grafite,
    chapeu: COR.marinhoClaro,
    handle: '#5A5A62',
    destaque: 'linear-gradient(90deg,#1E3F73,#4A7BD0)',
    brilho: 'radial-gradient(circle,rgba(74,123,208,.16) 0%,rgba(169,193,234,.1) 42%,rgba(255,255,255,0) 70%)',
    vidro: 'linear-gradient(140deg,rgba(255,255,255,.85),rgba(255,255,255,.55))',
    vidroBorda: 'rgba(14,14,16,.08)',
    ponto: COR.tinta,
    simbolo: COR.tinta,
  },
  escuro: {
    fundo: COR.tinta,
    texto: COR.papel,
    apoio: '#C3CAD6',
    chapeu: '#A9C1EA',
    handle: '#A9B4C8',
    destaque: 'linear-gradient(90deg,#FFFFFF 0%,#C9DAF6 40%,#6F9BE8 100%)',
    brilho: 'radial-gradient(circle,rgba(46,90,170,.34) 0%,rgba(11,31,58,.2) 42%,rgba(14,14,16,0) 70%)',
    vidro: 'linear-gradient(140deg,rgba(255,255,255,.09),rgba(255,255,255,.03))',
    vidroBorda: 'rgba(255,255,255,.16)',
    ponto: COR.papel,
    simbolo: COR.papel,
  },
};

export const FORMATO = {
  feed: { w: 1080, h: 1350, margem: [96, 96, 96, 96] },
  // Story e Reels: livres 250 px no topo e 340 px embaixo (interface do Instagram).
  story: { w: 1080, h: 1920, margem: [260, 88, 360, 88] },
};

export const HANDLE = '@pedrohoffman.ia';

// Símbolo Degrau (grade de 48). Nunca igualar colunas, espelhar ou esticar.
export function simbolo(tamanho, cor) {
  return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="18" width="11" height="24" rx="2" fill="${cor}"/><rect x="32" y="6" width="11" height="36" rx="2" fill="${cor}"/><rect x="14" y="25" width="20" height="9" fill="${cor}"/></svg>`;
}

export function simboloContorno(tamanho, cor) {
  return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 48 48" aria-hidden="true"><path d="M6.5 18 H14.5 Q16 18 16 19.5 V25 H32 V7.5 Q32 6 33.5 6 H41.5 Q43 6 43 7.5 V40.5 Q43 42 41.5 42 H33.5 Q32 42 32 40.5 V34 H16 V40.5 Q16 42 14.5 42 H6.5 Q5 42 5 40.5 V19.5 Q5 18 6.5 18 Z" fill="none" stroke="${cor}" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}

export function logo(tamanhoFonte, cor) {
  const s = Math.round(tamanhoFonte * 1.6);
  return `<div class="logo" style="color:${cor}">${simbolo(s, cor)}<span style="font-size:${tamanhoFonte}px"><b class="p">Pedro</b> <b class="h">Hoffman</b></span></div>`;
}

// Ícones de traço (estilo Lucide, 24 px). Use pelo nome no post.json.
const ICONES = {
  planilha: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  codigo: '<path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 6l-2 12"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mensagem: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  alerta: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  pasta: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  dinheiro: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  estoque: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  automacao: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  cadeado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};

export function icone(nome, tamanho, cor, traco = 1.7) {
  if (nome === 'simbolo') return simbolo(tamanho, cor);
  const corpo = ICONES[nome];
  if (!corpo) throw new Error(`Ícone "${nome}" não existe. Use: ${Object.keys(ICONES).join(', ')}, simbolo`);
  return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="${traco}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;
}

export const NOMES_ICONES = [...Object.keys(ICONES), 'simbolo'];
