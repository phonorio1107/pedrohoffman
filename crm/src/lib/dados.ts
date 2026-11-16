import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Analise } from './importar';
import type { AtualizacaoLead, Canal, DadosLead, EventoLead, Lead, Lote, Modelo, Nicho, TipoEvento } from './tipos';

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
  lead(id: string): Promise<Lead | null>;
  atualizarLead(id: string, mudanca: AtualizacaoLead): Promise<Lead>;
  eventos(leadId: string): Promise<EventoLead[]>;
  eventosDesde(desde: string, tipo: TipoEvento): Promise<EventoLead[]>;
  registrarEvento(leadId: string, tipo: TipoEvento, texto: string | null): Promise<void>;
  modelos(): Promise<Modelo[]>;
  salvarModelo(m: { nicho_id: string | null; canal: Canal; nome: string; texto: string }): Promise<Modelo>;
  apagarModelo(id: string): Promise<void>;
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
    async lead(id) {
      return ok(await sb.from('leads').select('*').eq('id', id).maybeSingle()) as Lead | null;
    },
    async atualizarLead(id, mudanca) {
      return ok(await sb.from('leads').update(mudanca).eq('id', id).select('*').single()) as Lead;
    },
    async eventos(leadId) {
      return ok(await sb.from('eventos_lead').select('id, lead_id, tipo, texto, criado_em').eq('lead_id', leadId).order('criado_em', { ascending: false })) as EventoLead[];
    },
    async registrarEvento(leadId, tipo, texto) {
      ok(await sb.from('eventos_lead').insert({ lead_id: leadId, tipo, texto }));
    },
    async eventosDesde(desde, tipo) {
      return ok(await sb.from('eventos_lead').select('id, lead_id, tipo, texto, criado_em').eq('tipo', tipo).gte('criado_em', desde)) as EventoLead[];
    },
    async modelos() {
      return ok(await sb.from('modelos_mensagem').select('id, nicho_id, canal, nome, texto')) as Modelo[];
    },
    async salvarModelo(m) {
      const busca = sb.from('modelos_mensagem').select('id').eq('canal', m.canal);
      const existente = ok(await (m.nicho_id ? busca.eq('nicho_id', m.nicho_id) : busca.is('nicho_id', null)).maybeSingle()) as { id: string } | null;
      const q = existente ? sb.from('modelos_mensagem').update(m).eq('id', existente.id) : sb.from('modelos_mensagem').insert(m);
      return ok(await q.select('id, nicho_id, canal, nome, texto').single()) as Modelo;
    },
    async apagarModelo(id) {
      ok(await sb.from('modelos_mensagem').delete().eq('id', id));
    },
  };
}

// Demonstração: guarda tudo no navegador ---------------------------------------

interface Banco {
  nichos: Nicho[];
  lotes: Lote[];
  leads: Lead[];
  eventos: EventoLead[];
  modelos: Modelo[];
}

const vazio = (): Banco => ({ nichos: [], lotes: [], leads: [], eventos: [], modelos: [] });

const CHAVE = 'crm-ph-demo';

function repositorioDemo(): Repositorio {
  // Reserva na memória: se o navegador bloquear o armazenamento, a sessão continua funcionando.
  let memoria: Banco = vazio();
  const ler = (): Banco => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) memoria = { ...vazio(), ...(JSON.parse(salvo) as Partial<Banco>) };
    } catch {
      /* usa a memória */
    }
    return memoria;
  };
  const gravar = (b: Banco) => {
    memoria = b;
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
        const novoId = id();
        b.eventos.push({ id: id(), lead_id: novoId, tipo: 'importado', texto: `Lote ${lote.nome}`, criado_em: agora() });
        b.leads.push({
          ...n,
          id: novoId,
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
        if (i >= 0) {
          b.leads[i] = { ...b.leads[i], ...(a.dados as DadosLead), atualizado_em: agora() };
          b.eventos.push({ id: id(), lead_id: a.id, tipo: 'atualizado', texto: `Dados atualizados pelo lote ${lote.nome}`, criado_em: agora() });
        }
      }
      gravar(b);
      return lote;
    },
    async desfazerLote(loteId) {
      const b = ler();
      const lote = b.lotes.find((l) => l.id === loteId);
      if (!lote || !podeDesfazer(lote)) throw new Error('Lote não encontrado, já desfeito ou com mais de 7 dias.');
      const antes = b.leads.length;
      const apagar = new Set(b.leads.filter((l) => l.lote_id === loteId).map((l) => l.id));
      b.leads = b.leads.filter((l) => !apagar.has(l.id));
      b.eventos = b.eventos.filter((e) => !apagar.has(e.lead_id));
      lote.desfeito_em = agora();
      gravar(b);
      return antes - b.leads.length;
    },
    async lead(leadId) {
      return ler().leads.find((l) => l.id === leadId) ?? null;
    },
    async atualizarLead(leadId, mudanca) {
      const b = ler();
      const i = b.leads.findIndex((l) => l.id === leadId);
      if (i < 0) throw new Error('Lead não encontrado.');
      b.leads[i] = { ...b.leads[i], ...mudanca, atualizado_em: agora() };
      gravar(b);
      return b.leads[i];
    },
    async eventos(leadId) {
      return ler()
        .eventos.filter((e) => e.lead_id === leadId)
        .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
    },
    async eventosDesde(desde, tipo) {
      return ler().eventos.filter((e) => e.tipo === tipo && e.criado_em >= desde);
    },
    async registrarEvento(leadId, tipo, texto) {
      const b = ler();
      b.eventos.push({ id: id(), lead_id: leadId, tipo, texto, criado_em: agora() });
      gravar(b);
    },
    async modelos() {
      return ler().modelos;
    },
    async salvarModelo(m) {
      const b = ler();
      const i = b.modelos.findIndex((x) => x.canal === m.canal && x.nicho_id === m.nicho_id);
      const salvo: Modelo = { id: i >= 0 ? b.modelos[i].id : id(), ...m };
      if (i >= 0) b.modelos[i] = salvo;
      else b.modelos.push(salvo);
      gravar(b);
      return salvo;
    },
    async apagarModelo(modeloId) {
      const b = ler();
      b.modelos = b.modelos.filter((x) => x.id !== modeloId);
      gravar(b);
    },
  };
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const repo: Repositorio = url && chave ? repositorioSupabase(createClient(url, chave)) : repositorioDemo();
