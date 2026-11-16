import type { Faixa, Motivo, Presenca } from './tipos';

/**
 * Nota de oportunidade (0 a 100). Quanto maior, mais a empresa precisa de você
 * e mais fácil é falar com ela.
 *
 * - Sem site próprio +35; só Instagram/Facebook, só iFood ou plataforma de cardápio +27
 * - Nota no Google 4,5 ou mais +20 (cliente satisfeito, negócio que funciona)
 * - 500 ou mais avaliações +15 (movimento)
 * - Celular (WhatsApp provável) +15
 * - E-mail confiável +15
 */
export const REGRAS = {
  semSite: 35,
  presencaAlugada: 27,
  notaGoogle: 20,
  notaGoogleMinima: 4.5,
  avaliacoes: 15,
  avaliacoesMinimas: 500,
  whatsapp: 15,
  email: 15,
} as const;

/** Sem e-mail na planilha a nota máxima é 85, por isso Alta começa em 65. */
export const FAIXAS = { alta: 65, media: 45 } as const;

export interface EntradaNota {
  presenca: Presenca;
  nota_google: number | null;
  avaliacoes: number | null;
  whatsapp_provavel: boolean;
  email: string | null;
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

export function calcularNota(e: EntradaNota): { nota: number; faixa: Faixa; motivos: Motivo[] } {
  const motivos: Motivo[] = [];
  if (e.presenca === 'sem_site') motivos.push({ texto: 'Sem site', pontos: REGRAS.semSite });
  if (e.presenca === 'so_instagram') motivos.push({ texto: 'Só Instagram ou Facebook', pontos: REGRAS.presencaAlugada });
  if (e.presenca === 'so_ifood') motivos.push({ texto: 'Só iFood', pontos: REGRAS.presencaAlugada });
  if (e.presenca === 'plataforma') motivos.push({ texto: 'Plataforma de cardápio alugada', pontos: REGRAS.presencaAlugada });
  if (e.nota_google !== null && e.nota_google >= REGRAS.notaGoogleMinima)
    motivos.push({ texto: `Google ${e.nota_google.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}`, pontos: REGRAS.notaGoogle });
  if (e.avaliacoes !== null && e.avaliacoes >= REGRAS.avaliacoesMinimas)
    motivos.push({ texto: `${fmt(e.avaliacoes)} avaliações`, pontos: REGRAS.avaliacoes });
  if (e.whatsapp_provavel) motivos.push({ texto: 'Celular (WhatsApp provável)', pontos: REGRAS.whatsapp });
  if (e.email) motivos.push({ texto: 'E-mail encontrado', pontos: REGRAS.email });

  const nota = Math.min(100, motivos.reduce((s, m) => s + m.pontos, 0));
  return { nota, faixa: faixaDaNota(nota), motivos };
}

export function faixaDaNota(nota: number): Faixa {
  if (nota >= FAIXAS.alta) return 'Alta';
  if (nota >= FAIXAS.media) return 'Média';
  return 'Baixa';
}
