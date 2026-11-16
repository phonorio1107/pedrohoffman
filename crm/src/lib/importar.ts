import Papa from 'papaparse';
import type { Mapa } from './colunas';
import { calcularNota } from './nota';
import { classificarPresenca, dominio } from './presenca';
import { marcarRedes } from './redes';
import { ehCelular, normalizarTelefone } from './telefone';
import type { DadosLead, Lead, Status } from './tipos';

export type Linha = Record<string, unknown>;
export interface Planilha {
  cabecalhos: string[];
  linhas: Linha[];
}

export function lerCsv(texto: string): Planilha {
  const r = Papa.parse<Linha>(texto.replace(/^﻿/, ''), { header: true, skipEmptyLines: 'greedy' });
  return { cabecalhos: r.meta.fields ?? [], linhas: r.data };
}

/** Primeira aba do Excel, primeira linha como cabeçalho. */
export function linhasParaPlanilha(matriz: unknown[][]): Planilha {
  const [topo = [], ...resto] = matriz;
  const cabecalhos = topo.map((c, i) => (c === null || c === undefined || c === '' ? `coluna_${i + 1}` : String(c)));
  const linhas = resto
    .filter((l) => l.some((v) => v !== null && v !== undefined && v !== ''))
    .map((l) => Object.fromEntries(cabecalhos.map((c, i) => [c, l[i] ?? null])));
  return { cabecalhos, linhas };
}

export async function lerArquivo(arquivo: File): Promise<Planilha> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith('.csv') || nome.endsWith('.txt')) return lerCsv(await arquivo.text());
  if (nome.endsWith('.xlsx')) {
    const { default: readXlsxFile } = await import('read-excel-file');
    return linhasParaPlanilha((await readXlsxFile(arquivo)) as unknown[][]);
  }
  throw new Error('Formato não suportado. Use CSV ou Excel (.xlsx).');
}

const texto = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s && s.toLowerCase() !== 'nan' && s.toLowerCase() !== 'null' ? s : null;
};

const numero = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = texto(v);
  if (!s) return null;
  const n = Number(s.replace(/\s/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const verdadeiro = (v: unknown) => v === true || ['true', 'sim', '1', 'yes', 'verdadeiro'].includes(String(v ?? '').trim().toLowerCase());

const PROVEDORES = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'uol.com.br', 'bol.com.br', 'terra.com.br', 'icloud.com', 'live.com', 'msn.com', 'globo.com', 'ig.com.br'];

/**
 * E-mail só vale se for do próprio site da empresa, ou de provedor comum
 * (gmail etc.) quando o site é próprio ou não existe. Quando o "site" é uma
 * plataforma de cardápio, o e-mail achado costuma ser da plataforma.
 */
export function emailConfiavel(email: string | null, site: string | null): string | null {
  const e = email?.split(/[,;\s]+/)[0]?.trim().toLowerCase();
  if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return null;
  const dEmail = e.split('@')[1];
  const presenca = classificarPresenca(site);
  const dSite = dominio(site);
  if (dSite && presenca === 'site_proprio') {
    const base = (d: string) => d.split('.').slice(0, -1).join('.').replace(/\.com$/, '');
    if (dSite.includes(dEmail) || dEmail.includes(base(dSite))) return e;
  }
  if (PROVEDORES.includes(dEmail) && (presenca === 'sem_site' || presenca === 'site_proprio')) return e;
  return null;
}

export function linhaParaLead(linha: Linha, mapa: Mapa): DadosLead | null {
  const v = (c: keyof Mapa) => (mapa[c] ? linha[mapa[c] as string] : null);
  const nome = texto(v('nome'));
  if (!nome) return null;

  const site = texto(v('site'));
  const telefone = texto(v('telefone'));
  const telefone_normalizado = normalizarTelefone(telefone);
  const whatsapp_provavel = ehCelular(telefone_normalizado);
  const email = emailConfiavel(texto(v('email')), site);
  const presenca = classificarPresenca(site);
  const nota_google = numero(v('nota_google'));
  const avaliacoes = numero(v('avaliacoes'));
  const { nota, faixa, motivos } = calcularNota({ presenca, nota_google, avaliacoes, whatsapp_provavel, email });

  let instagram = texto(v('instagram'));
  if (!instagram && site && dominio(site)?.endsWith('instagram.com')) instagram = site;

  return {
    nome,
    categoria: texto(v('categoria'))?.split(',')[0]?.trim() ?? null,
    endereco: texto(v('endereco')),
    bairro: texto(v('bairro')),
    cidade: texto(v('cidade')),
    telefone,
    telefone_normalizado,
    whatsapp_provavel,
    email,
    site,
    instagram,
    facebook: texto(v('facebook')),
    link_maps: texto(v('link_maps')),
    place_id: texto(v('place_id')),
    nota_google,
    avaliacoes: avaliacoes === null ? null : Math.round(avaliacoes),
    horario: texto(v('horario')),
    situacao: texto(v('situacao')),
    presenca,
    rede: verdadeiro(v('rede')),
    nota_oportunidade: nota,
    faixa,
    motivos,
  };
}

/** Status inicial e motivo de descarte de um lead novo. */
export function statusInicial(d: DadosLead): { status: Status; motivo_descarte: string | null } {
  if (d.rede) return { status: 'Descartado', motivo_descarte: 'Rede ou franquia' };
  if (d.situacao && !/operational|operando|aberto/i.test(d.situacao)) return { status: 'Descartado', motivo_descarte: 'Fechado no Google' };
  if (!d.telefone_normalizado && !d.email) return { status: 'Sem contato', motivo_descarte: null };
  return { status: 'Novo', motivo_descarte: null };
}

export function chaves(d: Pick<DadosLead, 'place_id' | 'telefone_normalizado' | 'link_maps' | 'nome' | 'endereco'>): string[] {
  const k: string[] = [];
  if (d.place_id) k.push(`id:${d.place_id}`);
  if (d.link_maps) k.push(`maps:${d.link_maps}`);
  // Telefone só identifica junto com o nome: redes dividem o mesmo número.
  if (d.telefone_normalizado) k.push(`tel:${d.telefone_normalizado}:${d.nome.toLowerCase()}`);
  if (!k.length && d.endereco) k.push(`end:${d.nome.toLowerCase()}:${d.endereco.toLowerCase()}`);
  return k;
}

export interface NovoLead extends DadosLead {
  status: Status;
  motivo_descarte: string | null;
}

export interface Analise {
  totalLinhas: number;
  ignoradas: number;
  novos: NovoLead[];
  atualizacoes: { id: string; dados: DadosLead }[];
  repetidasNoArquivo: number;
  resumo: { novos: number; atualizados: number; semContato: number; redes: number; fechados: number; alta: number; media: number; baixa: number };
}

export function analisarImportacao(planilha: Planilha, mapa: Mapa, existentes: Pick<Lead, 'id' | 'place_id' | 'telefone_normalizado' | 'link_maps' | 'nome' | 'endereco'>[]): Analise {
  const brutos = planilha.linhas.map((l) => linhaParaLead(l, mapa));
  const validos = brutos.filter((d): d is DadosLead => d !== null);
  const comRedes = marcarRedes(validos, (s) => classificarPresenca(s) === 'site_proprio');

  const porChave = new Map<string, string>();
  for (const e of existentes) for (const k of chaves(e)) porChave.set(k, e.id);

  const vistas = new Set<string>();
  const novos: NovoLead[] = [];
  const atualizacoes: Analise['atualizacoes'] = [];
  let repetidasNoArquivo = 0;

  for (const d of comRedes) {
    const ks = chaves(d);
    if (ks.some((k) => vistas.has(k))) {
      repetidasNoArquivo++;
      continue;
    }
    ks.forEach((k) => vistas.add(k));
    const existente = ks.map((k) => porChave.get(k)).find(Boolean);
    if (existente) atualizacoes.push({ id: existente, dados: d });
    else novos.push({ ...d, ...statusInicial(d) });
  }

  const conta = (f: (n: NovoLead) => boolean) => novos.filter(f).length;
  return {
    totalLinhas: planilha.linhas.length,
    ignoradas: brutos.length - validos.length,
    novos,
    atualizacoes,
    repetidasNoArquivo,
    resumo: {
      novos: conta((n) => n.status === 'Novo'),
      atualizados: atualizacoes.length,
      semContato: conta((n) => n.status === 'Sem contato'),
      redes: conta((n) => n.motivo_descarte === 'Rede ou franquia'),
      fechados: conta((n) => n.motivo_descarte === 'Fechado no Google'),
      alta: conta((n) => n.status === 'Novo' && n.faixa === 'Alta'),
      media: conta((n) => n.status === 'Novo' && n.faixa === 'Média'),
      baixa: conta((n) => n.status === 'Novo' && n.faixa === 'Baixa'),
    },
  };
}

/** "Jundiaí · nov/26" a partir da cidade mais comum do arquivo. */
export function nomeSugeridoDoLote(dados: Pick<DadosLead, 'cidade'>[], hoje = new Date()): string {
  const conta = new Map<string, number>();
  for (const d of dados) if (d.cidade) conta.set(d.cidade, (conta.get(d.cidade) ?? 0) + 1);
  const cidade = [...conta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Lote';
  const mes = hoje.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${cidade} · ${mes}/${String(hoje.getFullYear()).slice(2)}`;
}
