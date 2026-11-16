import { describe, expect, it } from 'vitest';
import { montarFila, motivoCurto } from './fila';
import type { Lead } from './tipos';

const base = { presenca: 'sem_site', nota_google: 4.8, avaliacoes: 1312, proximo_passo: null, data_proximo_passo: null, atualizado_em: '2026-11-10T10:00:00Z' } as Partial<Lead>;
const lead = (id: string, o: Partial<Lead>) => ({ ...base, id, nome: id, nota_oportunidade: 50, status: 'Novo', ...o }) as Lead;
const HOJE = '2026-11-16';

describe('fila do dia', () => {
  const leads = [
    lead('baixa', { nota_oportunidade: 40 }),
    lead('alta', { nota_oportunidade: 80 }),
    lead('media', { nota_oportunidade: 60 }),
    lead('vencido', { status: 'Contatado', data_proximo_passo: '2026-11-14', proximo_passo: 'Cobrar resposta' }),
    lead('hoje', { status: 'Contatado', data_proximo_passo: '2026-11-16' }),
    lead('futuro', { status: 'Contatado', data_proximo_passo: '2026-11-20' }),
    lead('respondeu', { status: 'Respondeu' }),
    lead('respondeu-vencido', { status: 'Respondeu', data_proximo_passo: '2026-11-15' }),
    lead('descartado', { status: 'Descartado', nota_oportunidade: 99 }),
    lead('piloto', { status: 'Piloto' }),
  ];

  it('ordena: retornos, prévias e primeiros contatos por nota', () => {
    const f = montarFila(leads, HOJE, 0, 12);
    expect(f.itens.map((i) => i.lead.id)).toEqual(['vencido', 'respondeu-vencido', 'hoje', 'respondeu', 'alta', 'media', 'baixa']);
    expect(f.retornos).toBe(3);
    expect(f.previas).toBe(1);
    expect(f.pilotos).toBe(1);
  });

  it('não repete quem respondeu e já tem retorno vencido, e ignora futuro e descartado', () => {
    const ids = montarFila(leads, HOJE, 0, 12).itens.map((i) => i.lead.id);
    expect(ids.filter((i) => i === 'respondeu-vencido')).toHaveLength(1);
    expect(ids).not.toContain('futuro');
    expect(ids).not.toContain('descartado');
  });

  it('limita os primeiros contatos pela meta que ainda falta', () => {
    expect(montarFila(leads, HOJE, 11, 12).itens.filter((i) => i.tipo === 'primeiro').map((i) => i.lead.id)).toEqual(['alta']);
    const batida = montarFila(leads, HOJE, 12, 12);
    expect(batida.restantes).toBe(0);
    expect(batida.itens.some((i) => i.tipo === 'primeiro')).toBe(false);
    expect(batida.retornos).toBe(3); // cobrar quem esfria continua na fila
  });

  it('descreve a ação e o motivo', () => {
    const f = montarFila(leads, HOJE, 0, 12);
    expect(f.itens.find((i) => i.lead.id === 'vencido')!.acao).toBe('Cobrar resposta · venceu em 14/11/2026');
    expect(f.itens.find((i) => i.lead.id === 'hoje')!.acao).toContain('é hoje');
    expect(motivoCurto(leads[0])).toBe('Sem site · 4,8 com 1.312 avaliações');
  });
});
