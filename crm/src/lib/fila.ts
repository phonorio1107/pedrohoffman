import { ROTULO_PRESENCA, type Lead } from './tipos';
import { dataBR, numeroBR } from './utils';

export const META_PADRAO = 12;
export const LIMITE_PILOTOS = 3;

export type TipoFila = 'retorno' | 'previa' | 'primeiro';
export interface ItemFila {
  lead: Lead;
  tipo: TipoFila;
  acao: string;
}

export interface Fila {
  itens: ItemFila[];
  retornos: number;
  previas: number;
  primeiros: number;
  /** Quantos primeiros contatos ainda cabem na meta de hoje. */
  restantes: number;
  pilotos: number;
}

const EM_CONVERSA = ['Contatado', 'Respondeu', 'Prévia enviada'];

/**
 * A fila do dia: retornos vencidos primeiro (quem esfria perde a venda), depois quem
 * respondeu e espera a prévia, depois primeiros contatos por nota até bater a meta.
 * `hoje` no formato AAAA-MM-DD.
 */
export function montarFila(leads: Lead[], hoje: string, enviadasHoje: number, meta: number): Fila {
  const retornos = leads
    .filter((l) => EM_CONVERSA.includes(l.status) && l.data_proximo_passo && l.data_proximo_passo <= hoje)
    .sort((a, b) => (a.data_proximo_passo ?? '').localeCompare(b.data_proximo_passo ?? ''));
  const idsRetorno = new Set(retornos.map((l) => l.id));
  const previas = leads.filter((l) => l.status === 'Respondeu' && !idsRetorno.has(l.id)).sort((a, b) => a.atualizado_em.localeCompare(b.atualizado_em));
  const restantes = Math.max(0, meta - enviadasHoje);
  const todosPrimeiros = leads.filter((l) => l.status === 'Novo').sort((a, b) => b.nota_oportunidade - a.nota_oportunidade);
  const primeiros = todosPrimeiros.slice(0, restantes);

  const acaoRetorno = (l: Lead) => {
    const d = l.data_proximo_passo ?? hoje;
    const quando = d < hoje ? `venceu em ${dataBR(d)}` : 'é hoje';
    return `${l.proximo_passo ?? 'Cobrar resposta'} · ${quando}`;
  };

  return {
    itens: [
      ...retornos.map((lead): ItemFila => ({ lead, tipo: 'retorno', acao: acaoRetorno(lead) })),
      ...previas.map((lead): ItemFila => ({ lead, tipo: 'previa', acao: 'Respondeu: mandar a prévia' })),
      ...primeiros.map((lead): ItemFila => ({ lead, tipo: 'primeiro', acao: 'Primeira mensagem' })),
    ],
    retornos: retornos.length,
    previas: previas.length,
    primeiros: primeiros.length,
    restantes,
    pilotos: leads.filter((l) => l.status === 'Piloto').length,
  };
}

/** "Só Instagram · 4,8 com 1.312 avaliações" */
export function motivoCurto(l: Pick<Lead, 'presenca' | 'nota_google' | 'avaliacoes'>): string {
  const google =
    l.nota_google !== null ? `${numeroBR(l.nota_google, 1)}${l.avaliacoes !== null ? ` com ${numeroBR(l.avaliacoes)} avaliações` : ''}` : null;
  return [ROTULO_PRESENCA[l.presenca], google].filter(Boolean).join(' · ');
}
