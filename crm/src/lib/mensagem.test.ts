import { describe, expect, it } from 'vitest';
import { LEAD_EXEMPLO, MODELOS_PADRAO, partesDaMensagem, preencher, valoresDoLead } from './mensagem';

describe('mensagem', () => {
  it('preenche as variáveis com os dados do lead', () => {
    const v = valoresDoLead(LEAD_EXEMPLO);
    expect(v.nota).toBe('4,8');
    expect(v.avaliacoes).toBe('1.312');
    expect(v.presenca).toBe('sem site');
    const r = preencher('Vi a {{nome}} em {{ cidade }}, nota {{nota}}.', v);
    expect(r.texto).toBe('Vi a Burger do Bairro em Jundiaí, nota 4,8.');
    expect(r.faltando).toEqual([]);
  });

  it('avisa o que ficou sem dado e não deixa chaves soltas', () => {
    const v = valoresDoLead({ ...LEAD_EXEMPLO, bairro: null, nota_google: null });
    const r = preencher('{{nome}} no {{bairro}}, nota {{nota}}, {{inventada}}', v);
    expect(r.faltando).toEqual(['bairro', 'nota', 'inventada']);
    expect(r.texto).not.toContain('{{');
    expect(partesDaMensagem('a {{bairro}} b', v).map((p) => p.tipo)).toEqual(['texto', 'faltando', 'texto']);
  });

  it('os modelos padrão só usam variáveis que existem e não prometem nada', () => {
    const v = valoresDoLead(LEAD_EXEMPLO);
    for (const [canal, texto] of Object.entries(MODELOS_PADRAO)) {
      expect(preencher(texto, v).faltando, canal).toEqual([]);
      expect(texto, canal).not.toMatch(/garant|disruptiv|IA de ponta|[\u{1F300}-\u{1FAFF}]/u);
    }
    expect(MODELOS_PADRAO.WhatsApp.trimEnd().endsWith('?')).toBe(true);
  });
});
