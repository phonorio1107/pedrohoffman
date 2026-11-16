import { ROTULO_PRESENCA, type Canal, type Lead } from './tipos';
import { numeroBR } from './utils';

export const VARIAVEIS = [
  { chave: 'nome', rotulo: 'Nome da empresa' },
  { chave: 'cidade', rotulo: 'Cidade' },
  { chave: 'bairro', rotulo: 'Bairro' },
  { chave: 'nota', rotulo: 'Nota no Google' },
  { chave: 'avaliacoes', rotulo: 'Avaliações' },
  { chave: 'presenca', rotulo: 'Presença online' },
] as const;

/**
 * Modelos padrão: valem para qualquer negócio local enquanto não há nicho definido.
 * Voz da marca: frases curtas, a dor antes da tecnologia, sem promessa e sem emoji.
 * A mensagem termina com uma pergunta, sem palavra-código.
 */
export const MODELOS_PADRAO: Record<Canal, string> = {
  WhatsApp:
    'Oi, tudo bem? Aqui é o Pedro Hoffman. Vi a {{nome}} aqui em {{cidade}}.\n\nEu monto sistemas sob medida para a rotina de pequenas empresas: pedidos, orçamentos, agenda. Hoje vocês controlam isso pelo WhatsApp ou em planilha?\n\nSe fizer sentido, posso te mandar uma prévia de como ficaria, sem compromisso?',
  Direct:
    'Oi! Aqui é o Pedro Hoffman. Vi a {{nome}} e queria entender uma coisa: vocês controlam pedidos e orçamentos pelo WhatsApp ou em planilha? Eu monto sistemas sob medida para isso. Posso te mandar uma prévia?',
  'E-mail':
    'Assunto: Uma ideia para a rotina da {{nome}}\n\nOlá! Aqui é o Pedro Hoffman.\n\nEu monto sistemas sob medida para a rotina de pequenas empresas: pedidos, orçamentos e agenda no mesmo lugar, no lugar de planilha e conversa solta.\n\nHoje a {{nome}} controla isso como? Se fizer sentido, preparo uma prévia de como ficaria, sem compromisso.\n\nPedro Hoffman',
};

/** Lead de exemplo (inventado) para a prévia na tela de modelos. */
export const LEAD_EXEMPLO = { nome: 'Burger do Bairro', cidade: 'Jundiaí', bairro: 'Centro', nota_google: 4.8, avaliacoes: 1312, presenca: 'sem_site' as const };

type Fonte = Pick<Lead, 'nome' | 'cidade' | 'bairro' | 'nota_google' | 'avaliacoes' | 'presenca'>;

export function valoresDoLead(l: Fonte): Record<string, string> {
  return {
    nome: l.nome ?? '',
    cidade: l.cidade ?? '',
    bairro: l.bairro ?? '',
    nota: l.nota_google === null ? '' : numeroBR(l.nota_google, 1),
    avaliacoes: l.avaliacoes === null ? '' : numeroBR(l.avaliacoes),
    presenca: ROTULO_PRESENCA[l.presenca].toLowerCase(),
  };
}

export type Parte = { tipo: 'texto'; valor: string } | { tipo: 'variavel'; chave: string; valor: string } | { tipo: 'faltando'; chave: string };

const RE = /\{\{\s*([a-z_]+)\s*\}\}/g;

/** Quebra o texto em pedaços para destacar o que foi preenchido e o que ficou sem dado. */
export function partesDaMensagem(texto: string, valores: Record<string, string>): Parte[] {
  const partes: Parte[] = [];
  let fim = 0;
  for (const m of texto.matchAll(RE)) {
    const i = m.index ?? 0;
    if (i > fim) partes.push({ tipo: 'texto', valor: texto.slice(fim, i) });
    const valor = valores[m[1]];
    partes.push(valor ? { tipo: 'variavel', chave: m[1], valor } : { tipo: 'faltando', chave: m[1] });
    fim = i + m[0].length;
  }
  if (fim < texto.length) partes.push({ tipo: 'texto', valor: texto.slice(fim) });
  return partes;
}

export function preencher(texto: string, valores: Record<string, string>): { texto: string; faltando: string[] } {
  const partes = partesDaMensagem(texto, valores);
  return {
    texto: partes.map((p) => (p.tipo === 'faltando' ? '' : p.valor)).join(''),
    faltando: [...new Set(partes.filter((p) => p.tipo === 'faltando').map((p) => (p as { chave: string }).chave))],
  };
}
