import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Analise } from './importar';
import type { DadosLead, Lead, Lote, Nicho } from './tipos';

export interface NovoLote {
  nome: string;
  nicho_id: string | null;
  arquivo: string;
}

/** Tudo o que as telas precisam do banco. Duas versões: Supabase e demonstração. */
export interface Repositorio {
  modo: 'supabase' | 'demo';
  usuario(): Promise<string | null>;
  entrar(email: string, senha: string): Promise<void>;
  sair(): Promise<void>;
  nichos(): Promise<Nicho[]>;
  criarNicho(nome: string): Promise<Nicho>;
  leads(): Promise<Lead[]>;
  lotes(): Promise<Lote[]>;
  importar(lote: NovoLote, analise: Analise): Promise<Lote>;
  desfazerLote(id: string): Promise<number>;
}

const agora = () => new Date().toISOString();
const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

export function podeDesfazer(lote: Lote): boolean {
  return !lote.desfeito_em && Date.now() - new Date(lote.criado_em).getTime() < SETE_DIAS;
}

function contagens(analise: Analise) {
  return {
    total_linhas: analise.totalLinhas,
    novos: analise.resumo.novos,
    atualizados: analise.resumo.atualizados,
    sem_contato: analise.resumo.semContato,
    descartados: analise.resumo.redes + analise.resumo.fechados,
  };
}

// Supabase ----------------------------------------------------------------------

function repositorioSupabase(sb: SupabaseClient): Repositorio {
  const ok = <T>(r: { data: T | null; error: { message: string } | null }): T => {
    if (r.error) throw new Error(r.error.message);
    return r.data as T;
  };
  const emPartes = <T>(lista: T[], tamanho = 500) =>
    Array.from({ length: Math.ceil(lista.length / tamanho) }, (_, i) => lista.slice(i * tamanho, (i + 1) * tamanho));

  return {
    modo: 'supabase',
    async usuario() {
      const { data } = await sb.auth.getSession();
      return data.session?.user.email ?? null;
    },
    async entrar(email, senha) {
      const { error } = await sb.auth.signInWithPassword({ email, password: senha });
      if (error) throw new Error('E-mail ou senha incorretos.');
    },
    async sair() {
      await sb.auth.signOut();
    },
    async nichos() {
      return ok(await sb.from('nichos').select('id, nome, ativo').order('nome'));
    },
    async criarNicho(nome) {
      return ok(await sb.from('nichos').insert({ nome }).select('id, nome, ativo').single());
    },
    async leads() {
      const todos: Lead[] = [];
      for (let de = 0; ; de += 1000) {
        const parte = ok(await sb.from('leads').select('*').order('nota_oportunidade', { ascending: false }).range(de, de + 999)) as Lead[];
        todos.push(...parte);
        if (parte.length < 1000) break;
      }
      return todos;
    },
    async lotes() {
      return ok(await sb.from('lotes').select('*').order('criado_em', { ascending: false }));
    },
    async importar(novo, analise) {
      const lote = ok(await sb.from('lotes').insert({ ...novo, ...contagens(analise) }).select('*').single()) as Lote;
      for (const parte of emPartes(analise.novos)) {
        const criados = ok(
          await sb.from('leads').insert(parte.map((n) => ({ ...n, lote_id: lote.id, nicho_id: novo.nicho_id }))).select('id'),
        ) as { id: string }[];
        ok(await sb.from('eventos_lead').insert(criados.map((c) => ({ lead_id: c.id, tipo: 'importado', texto: `Lote ${lote.nome}` }))));
      }
      for (const a of analise.atualizacoes) {
        ok(await sb.from('leads').update(a.dados).eq('id', a.id));
        ok(await sb.from('eventos_lead').insert({ lead_id: a.id, tipo: 'atualizado', texto: `Dados atualizados pelo lote ${lote.nome}` }));
      }
      return lote;
    },
    async desfazerLote(id) {
      return ok(await sb.rpc('desfazer_lote', { p_lote: id })) as number;
    },
  };
}

// Demonstração: guarda tudo no navegador ---------------------------------------

interface Banco {
  nichos: Nicho[];
  lotes: Lote[];
  leads: Lead[];
}

const CHAVE = 'crm-ph-demo';

function repositorioDemo(): Repositorio {
  const ler = (): Banco => {
    try {
      return JSON.parse(localStorage.getItem(CHAVE) ?? '') as Banco;
    } catch {
      return { nichos: [], lotes: [], leads: [] };
    }
  };
  const gravar = (b: Banco) => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(b));
    } catch {
      /* navegador sem armazenamento: segue só na memória */
    }
  };
  const id = () => crypto.randomUUID();

  return {
    modo: 'demo',
    async usuario() {
      return 'modo demonstração';
    },
    async entrar() {},
    async sair() {},
    async nichos() {
      return ler().nichos;
    },
    async criarNicho(nome) {
      const b = ler();
      const n = { id: id(), nome, ativo: true };
      b.nichos.push(n);
      gravar(b);
      return n;
    },
    async leads() {
      return [...ler().leads].sort((a, b) => b.nota_oportunidade - a.nota_oportunidade);
    },
    async lotes() {
      return [...ler().lotes].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
    },
    async importar(novo, analise) {
      const b = ler();
      const lote: Lote = { id: id(), ...novo, criado_em: agora(), desfeito_em: null, ...contagens(analise) };
      b.lotes.push(lote);
      for (const n of analise.novos) {
        b.leads.push({
          ...n,
          id: id(),
          lote_id: lote.id,
          nicho_id: novo.nicho_id,
          proximo_passo: null,
          data_proximo_passo: null,
          observacoes: null,
          criado_em: agora(),
          atualizado_em: agora(),
        });
      }
      for (const a of analise.atualizacoes) {
        const i = b.leads.findIndex((l) => l.id === a.id);
        if (i >= 0) b.leads[i] = { ...b.leads[i], ...(a.dados as DadosLead), atualizado_em: agora() };
      }
      gravar(b);
      return lote;
    },
    async desfazerLote(loteId) {
      const b = ler();
      const lote = b.lotes.find((l) => l.id === loteId);
      if (!lote || !podeDesfazer(lote)) throw new Error('Lote não encontrado, já desfeito ou com mais de 7 dias.');
      const antes = b.leads.length;
      b.leads = b.leads.filter((l) => l.lote_id !== loteId);
      lote.desfeito_em = agora();
      gravar(b);
      return antes - b.leads.length;
    },
  };
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const repo: Repositorio = url && chave ? repositorioSupabase(createClient(url, chave)) : repositorioDemo();
