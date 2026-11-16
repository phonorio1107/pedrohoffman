import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { mapearColunas } from './colunas';
import { analisarImportacao, emailConfiavel, lerCsv, linhasParaPlanilha, nomeSugeridoDoLote } from './importar';
import { calcularNota } from './nota';
import { classificarPresenca } from './presenca';
import { ehCelular, normalizarTelefone } from './telefone';

const csv = readFileSync(fileURLToPath(new URL('./__fixtures__/exemplo-outscraper.csv', import.meta.url)), 'utf8');

describe('presença', () => {
  it('classifica o site', () => {
    expect(classificarPresenca(null)).toBe('sem_site');
    expect(classificarPresenca('https://www.instagram.com/loja')).toBe('so_instagram');
    expect(classificarPresenca('https://www.facebook.com/loja')).toBe('so_instagram');
    expect(classificarPresenca('https://www.ifood.com.br/delivery/x')).toBe('so_ifood');
    expect(classificarPresenca('https://app.cardapioweb.com/loja')).toBe('plataforma');
    expect(classificarPresenca('https://loja.menudino.com')).toBe('plataforma');
    expect(classificarPresenca('https://linktr.ee/loja')).toBe('plataforma');
    expect(classificarPresenca('lojaexemplo.com.br')).toBe('site_proprio');
  });
});

describe('telefone', () => {
  it('normaliza e reconhece celular', () => {
    expect(normalizarTelefone('+55 11 98888-1111')).toBe('5511988881111');
    expect(normalizarTelefone('(11) 4500-3333')).toBe('551145003333');
    expect(normalizarTelefone('+5515981591555, +5521990702270')).toBe('5515981591555');
    expect(normalizarTelefone('123')).toBeNull();
    expect(ehCelular('5511988881111')).toBe(true);
    expect(ehCelular('551145003333')).toBe(false);
  });
});

describe('nota de oportunidade', () => {
  it('soma os motivos e define a faixa', () => {
    const r = calcularNota({ presenca: 'sem_site', nota_google: 4.8, avaliacoes: 1312, whatsapp_provavel: true, email: null });
    expect(r.nota).toBe(85);
    expect(r.faixa).toBe('Alta');
    expect(r.motivos.map((m) => m.pontos)).toEqual([35, 20, 15, 15]);
    expect(calcularNota({ presenca: 'plataforma', nota_google: 4.6, avaliacoes: 10, whatsapp_provavel: false, email: null }).faixa).toBe('Média');
    expect(calcularNota({ presenca: 'site_proprio', nota_google: 4.0, avaliacoes: 10, whatsapp_provavel: true, email: null }).faixa).toBe('Baixa');
  });
});

describe('e-mail', () => {
  it('descarta e-mail da plataforma e aceita o do próprio site', () => {
    expect(emailConfiavel('contato@cardapioweb.com', 'https://app.cardapioweb.com/x')).toBeNull();
    expect(emailConfiavel('loja@gmail.com', 'https://app.menudino.com/x')).toBeNull();
    expect(emailConfiavel('ola@casapropria.com.br', 'https://casapropria.com.br')).toBe('ola@casapropria.com.br');
    expect(emailConfiavel('loja@gmail.com', null)).toBe('loja@gmail.com');
  });
});

describe('importação', () => {
  const planilha = lerCsv(csv);
  const mapa = mapearColunas(planilha.cabecalhos);

  it('reconhece as colunas do Outscraper', () => {
    expect(mapa.nome).toBe('name');
    expect(mapa.telefone).toBe('phone');
    expect(mapa.site).toBe('website');
    expect(mapa.bairro).toBe('county');
    expect(mapa.place_id).toBe('place_id');
    expect(mapa.horario).toBe('working_hours_csv_compatible');
  });

  it('separa novos, redes, fechados, sem contato e repetidos', () => {
    const a = analisarImportacao(planilha, mapa, []);
    expect(a.totalLinhas).toBe(10);
    expect(a.repetidasNoArquivo).toBe(1);
    expect(a.resumo.redes).toBe(3); // 2 com o mesmo site + Madero
    expect(a.resumo.fechados).toBe(1);
    expect(a.resumo.semContato).toBe(1);
    expect(a.resumo.novos).toBe(4);
    const bairro = a.novos.find((n) => n.nome === 'Burger do Bairro')!;
    expect(bairro.nota_oportunidade).toBe(85);
    expect(a.novos.find((n) => n.nome === 'Smash Exemplo')!.email).toBeNull();
  });

  it('atualiza em vez de duplicar o que já existe', () => {
    const a = analisarImportacao(planilha, mapa, [
      { id: 'x1', place_id: 'ID-001', telefone_normalizado: null, link_maps: null, nome: 'Burger do Bairro', endereco: null },
    ]);
    expect(a.atualizacoes).toHaveLength(1);
    expect(a.atualizacoes[0].id).toBe('x1');
    expect(a.resumo.novos).toBe(3);
  });

  it('lê a matriz do Excel e sugere o nome do lote', () => {
    const p = linhasParaPlanilha([['name', 'city'], ['A', 'Jundiaí'], [null, null], ['B', 'Jundiaí']]);
    expect(p.linhas).toHaveLength(2);
    expect(nomeSugeridoDoLote([{ cidade: 'Jundiaí' }], new Date(2026, 10, 16))).toBe('Jundiaí · nov/26');
  });
});
