import { ChevronDown, Download, ExternalLink, FileUp, Mail, MapPin, MessageCircle, Search, Star } from 'lucide-react';
import Papa from 'papaparse';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Botao, classeBotao } from '@/components/ui/botao';
import { Campo, Selecao } from '@/components/ui/campo';
import { Cartao } from '@/components/ui/cartao';
import { Etiqueta, type Tom } from '@/components/ui/etiqueta';
import { repo } from '@/lib/dados';
import { formatarTelefone, linkWhatsApp } from '@/lib/telefone';
import { PRESENCAS, ROTULO_PRESENCA, type Faixa, type Lead, type Lote, type Status } from '@/lib/tipos';
import { cn, dataBR, numeroBR } from '@/lib/utils';

const ABAS = [
  { id: 'fila', rotulo: 'Na fila', filtro: (l: Lead) => l.status === 'Novo' },
  { id: 'alta', rotulo: 'Alta oportunidade', filtro: (l: Lead) => l.status === 'Novo' && l.faixa === 'Alta' },
  { id: 'semsite', rotulo: 'Sem site', filtro: (l: Lead) => l.presenca === 'sem_site' && l.status !== 'Descartado' },
  { id: 'conversa', rotulo: 'Em conversa', filtro: (l: Lead) => ['Contatado', 'Respondeu', 'Prévia enviada', 'Piloto'].includes(l.status) },
  { id: 'todos', rotulo: 'Todos', filtro: (l: Lead) => l.status !== 'Descartado' },
  { id: 'descartados', rotulo: 'Descartados', filtro: (l: Lead) => l.status === 'Descartado' },
] as const;

const FUNIL: { rotulo: string; status: Status[] }[] = [
  { rotulo: 'Importados', status: ['Novo', 'Contatado', 'Respondeu', 'Prévia enviada', 'Piloto', 'Cliente', 'Sem contato'] },
  { rotulo: 'Contatados', status: ['Contatado', 'Respondeu', 'Prévia enviada', 'Piloto', 'Cliente'] },
  { rotulo: 'Responderam', status: ['Respondeu', 'Prévia enviada', 'Piloto', 'Cliente'] },
  { rotulo: 'Prévia enviada', status: ['Prévia enviada', 'Piloto', 'Cliente'] },
  { rotulo: 'Piloto', status: ['Piloto', 'Cliente'] },
  { rotulo: 'Cliente', status: ['Cliente'] },
];

const TOM_FAIXA: Record<Faixa, Tom> = { Alta: 'escuro', Média: 'marinho', Baixa: 'neutro' };
const TOM_STATUS: Partial<Record<Status, Tom>> = {
  Novo: 'neutro',
  Contatado: 'marinho',
  Respondeu: 'marinho',
  'Prévia enviada': 'marinho',
  Piloto: 'atencao',
  Cliente: 'sucesso',
  'Sem contato': 'atencao',
  Descartado: 'neutro',
};

function Funil({ leads }: { leads: Lead[] }) {
  const valores = FUNIL.map((f) => leads.filter((l) => f.status.includes(l.status)).length);
  return (
    <Cartao className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Degraus do funil</h2>
        <p className="text-xs text-cinza">% sobre o degrau anterior</p>
      </div>
      <ol className="mt-4 grid grid-cols-3 items-end gap-2 sm:grid-cols-6">
        {FUNIL.map((f, i) => {
          const taxa = i > 0 && valores[i - 1] > 0 ? Math.round((valores[i] / valores[i - 1]) * 100) : null;
          return (
            <li key={f.rotulo} className="flex flex-col justify-end">
              <p className="num font-titulo text-2xl font-bold">{valores[i]}</p>
              <p className="text-xs text-grafite">{f.rotulo}</p>
              <p className="num h-4 text-xs text-cinza">{taxa === null ? '' : `${taxa}%`}</p>
              <div className={cn('mt-1 rounded-t-md', i === 5 ? 'bg-tinta' : i === 0 ? 'bg-nevoa' : 'bg-grafite')} style={{ height: 12 + i * 10, opacity: i === 0 || i === 5 ? 1 : 0.35 + i * 0.13 }} />
            </li>
          );
        })}
      </ol>
    </Cartao>
  );
}

function exportarCsv(leads: Lead[]): Promise<string> {
  const csv = Papa.unparse(
    leads.map((l) => ({
      nome: l.nome,
      categoria: l.categoria,
      bairro: l.bairro,
      cidade: l.cidade,
      telefone: l.telefone_normalizado ? formatarTelefone(l.telefone_normalizado) : l.telefone,
      whatsapp_provavel: l.whatsapp_provavel ? 'sim' : 'não',
      email: l.email,
      site: l.site,
      presenca: ROTULO_PRESENCA[l.presenca],
      nota_google: l.nota_google,
      avaliacoes: l.avaliacoes,
      nota_oportunidade: l.nota_oportunidade,
      faixa: l.faixa,
      status: l.status,
      proximo_passo: l.proximo_passo,
      link_maps: l.link_maps,
    })),
  );
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `leads-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
  return Promise.resolve('baixado');
}

export function Leads() {
  const [params, setParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [aberto, setAberto] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const aba = params.get('aba') ?? 'fila';
  const busca = params.get('q') ?? '';
  const lote = params.get('lote') ?? '';
  const presenca = params.get('presenca') ?? '';
  const faixa = params.get('faixa') ?? '';
  const cidade = params.get('cidade') ?? '';

  const mudar = (chave: string, valor: string) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(chave, valor);
    else p.delete(chave);
    setParams(p, { replace: true });
  };

  useEffect(() => {
    Promise.all([repo.leads(), repo.lotes()])
      .then(([l, lt]) => {
        setLeads(l);
        setLotes(lt);
      })
      .catch((e) => setErro((e as Error).message));
  }, []);

  const doLote = useMemo(() => (leads ?? []).filter((l) => !lote || l.lote_id === lote), [leads, lote]);
  const cidades = useMemo(() => [...new Set((leads ?? []).map((l) => l.cidade).filter(Boolean) as string[])].sort(), [leads]);

  const visiveis = useMemo(() => {
    const filtroAba = ABAS.find((a) => a.id === aba)?.filtro ?? ABAS[0].filtro;
    const q = busca
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
    return doLote.filter((l) => {
      if (!filtroAba(l)) return false;
      if (presenca && l.presenca !== presenca) return false;
      if (faixa && l.faixa !== faixa) return false;
      if (cidade && l.cidade !== cidade) return false;
      if (q) {
        const alvo = `${l.nome} ${l.bairro ?? ''} ${l.categoria ?? ''} ${l.telefone_normalizado ?? ''}`
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .toLowerCase();
        if (!alvo.includes(q)) return false;
      }
      return true;
    });
  }, [doLote, aba, busca, presenca, faixa, cidade]);

  if (erro) return <p className="rounded-md bg-erro-fundo px-3 py-2 text-sm text-erro">{erro}</p>;
  if (!leads) return <p className="text-sm text-cinza">Carregando…</p>;

  if (!leads.length)
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Cartao className="mt-6 flex flex-col items-start gap-3 p-6">
          <p className="font-titulo text-lg font-semibold">Nenhum lead ainda.</p>
          <p className="text-sm text-grafite">Importe a primeira planilha do Google Maps para montar a fila.</p>
          <Link to="/importar" className={classeBotao('principal')}>
            <FileUp size={16} aria-hidden="true" /> Importar planilha
          </Link>
        </Cartao>
      </div>
    );

  const loteAtual = lotes.find((l) => l.id === lote);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-grafite">
            {loteAtual ? `Lote ${loteAtual.nome} · ` : ''}
            {doLote.filter((l) => l.status !== 'Descartado').length} na base · ordenados pela nota de oportunidade
          </p>
        </div>
        <div className="flex gap-2">
          <Botao
            onClick={async () => {
              const r = await exportarCsv(visiveis);
              setAviso(r === 'copiado' ? 'CSV copiado: cole numa planilha.' : r === 'falhou' ? 'Não consegui copiar o CSV.' : '');
              setTimeout(() => setAviso(''), 4000);
            }}
          >
            <Download size={16} aria-hidden="true" /> {import.meta.env.VITE_ARTIFACT ? 'Copiar CSV' : 'Exportar CSV'}
          </Botao>
          <Link to="/importar" className={classeBotao('principal')}>
            <FileUp size={16} aria-hidden="true" /> Importar planilha
          </Link>
        </div>
      </div>

      {aviso && (
        <p role="status" className="mt-3 rounded-md bg-sucesso-fundo px-3 py-2 text-sm text-sucesso">
          {aviso}
        </p>
      )}
      <div className="mt-6">
        <Funil leads={doLote} />
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-nevoa" role="tablist" aria-label="Visões">
        {ABAS.map((a) => {
          const n = doLote.filter(a.filtro).length;
          return (
            <button
              key={a.id}
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => mudar('aba', a.id === 'fila' ? '' : a.id)}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm',
                aba === a.id ? 'border-tinta font-semibold text-tinta' : 'border-transparent text-cinza hover:text-tinta',
              )}
            >
              {a.rotulo} <span className="num text-cinza">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_repeat(4,180px)]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cinza" aria-hidden="true" />
          <Campo className="pl-9" placeholder="Buscar nome, bairro ou telefone" value={busca} onChange={(e) => mudar('q', e.target.value)} aria-label="Buscar" />
        </div>
        <Selecao value={lote} onChange={(e) => mudar('lote', e.target.value)} aria-label="Lote">
          <option value="">Todos os lotes</option>
          {lotes
            .filter((l) => !l.desfeito_em)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
        </Selecao>
        <Selecao value={presenca} onChange={(e) => mudar('presenca', e.target.value)} aria-label="Presença online">
          <option value="">Toda presença</option>
          {PRESENCAS.map((p) => (
            <option key={p} value={p}>
              {ROTULO_PRESENCA[p]}
            </option>
          ))}
        </Selecao>
        <Selecao value={faixa} onChange={(e) => mudar('faixa', e.target.value)} aria-label="Oportunidade">
          <option value="">Toda oportunidade</option>
          <option value="Alta">Alta</option>
          <option value="Média">Média</option>
          <option value="Baixa">Baixa</option>
        </Selecao>
        <Selecao value={cidade} onChange={(e) => mudar('cidade', e.target.value)} aria-label="Cidade">
          <option value="">Todas as cidades</option>
          {cidades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Selecao>
      </div>

      <Cartao className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-fundo text-left text-xs uppercase tracking-[0.08em] text-cinza">
              <tr>
                <th className="px-4 py-2 font-semibold">Empresa</th>
                <th className="px-4 py-2 font-semibold">Nota</th>
                <th className="px-4 py-2 font-semibold">Presença</th>
                <th className="px-4 py-2 font-semibold">Google</th>
                <th className="px-4 py-2 font-semibold">Contato</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Próximo passo</th>
                <th className="w-10 px-2 py-2">
                  <span className="sr-only">Detalhes</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((l) => (
                <Fragment key={l.id}>
                  <tr className={cn('border-t border-nevoa align-top hover:bg-fundo/60', aberto === l.id && 'bg-fundo/60')}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-tinta">{l.nome}</p>
                      <p className="text-xs text-cinza">{[l.categoria, l.bairro, l.cidade].filter(Boolean).join(' · ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Etiqueta tom={TOM_FAIXA[l.faixa]} className="num" title={l.motivos.map((m) => `${m.texto} +${m.pontos}`).join(' · ')}>
                        {l.nota_oportunidade} · {l.faixa}
                      </Etiqueta>
                    </td>
                    <td className="px-4 py-3 text-grafite">{ROTULO_PRESENCA[l.presenca]}</td>
                    <td className="num whitespace-nowrap px-4 py-3 text-grafite">
                      {l.nota_google !== null && (
                        <span className="inline-flex items-center gap-1">
                          <Star size={13} aria-hidden="true" /> {numeroBR(l.nota_google, 1)}
                        </span>
                      )}
                      {l.avaliacoes !== null && <span className="text-cinza"> · {numeroBR(l.avaliacoes)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {l.telefone_normalizado ? (
                        <span className="num inline-flex items-center gap-1 whitespace-nowrap text-grafite">
                          {l.whatsapp_provavel && <MessageCircle size={14} className="text-sucesso" aria-label="WhatsApp provável" />}
                          {formatarTelefone(l.telefone_normalizado)}
                        </span>
                      ) : (
                        <span className="text-cinza">Sem telefone</span>
                      )}
                      {l.email && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-cinza">
                          <Mail size={12} aria-hidden="true" /> {l.email}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Etiqueta tom={TOM_STATUS[l.status]}>{l.status}</Etiqueta>
                      {l.motivo_descarte && <p className="mt-1 text-xs text-cinza">{l.motivo_descarte}</p>}
                    </td>
                    <td className="px-4 py-3 text-grafite">
                      {l.proximo_passo ?? (l.status === 'Novo' ? 'Primeira mensagem' : '')}
                      {l.data_proximo_passo && <p className="num text-xs text-cinza">{dataBR(l.data_proximo_passo)}</p>}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => setAberto(aberto === l.id ? null : l.id)}
                        className="grid h-8 w-8 place-items-center rounded-md text-cinza hover:bg-nevoa"
                        aria-expanded={aberto === l.id}
                        aria-label={`Ver detalhes de ${l.nome}`}
                      >
                        <ChevronDown size={16} className={cn('transition-transform', aberto === l.id && 'rotate-180')} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                  {aberto === l.id && (
                    <tr className="bg-fundo/60">
                      <td colSpan={8} className="px-4 pb-4">
                        <div className="grid gap-4 rounded-campo bg-papel p-4 md:grid-cols-[260px_1fr]">
                          <div className="rounded-campo bg-tinta p-4 text-white">
                            <p className="text-xs uppercase tracking-[0.1em] text-[#C3C3CA]">Nota de oportunidade</p>
                            <p className="num font-titulo text-4xl font-bold">{l.nota_oportunidade}</p>
                            <ul className="mt-2 space-y-1 text-sm">
                              {l.motivos.map((m) => (
                                <li key={m.texto} className="flex justify-between gap-2">
                                  <span className="text-[#C3C3CA]">{m.texto}</span>
                                  <span className="num font-semibold">+{m.pontos}</span>
                                </li>
                              ))}
                              {!l.motivos.length && <li className="text-[#C3C3CA]">Nenhum ponto: site próprio e pouca movimentação.</li>}
                            </ul>
                          </div>
                          <div className="space-y-2 text-sm text-grafite">
                            {l.endereco && (
                              <p className="flex items-start gap-2">
                                <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {l.endereco}
                              </p>
                            )}
                            {l.horario && <p className="text-xs text-cinza">Horário: {l.horario.replaceAll('|', ' · ')}</p>}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {l.telefone_normalizado && (
                                <a className="inline-flex items-center gap-1 rounded-md border border-nevoa px-2 py-1 hover:bg-fundo" href={linkWhatsApp(l.telefone_normalizado)} target="_blank" rel="noreferrer">
                                  <MessageCircle size={14} aria-hidden="true" /> WhatsApp
                                </a>
                              )}
                              {l.link_maps && (
                                <a className="inline-flex items-center gap-1 rounded-md border border-nevoa px-2 py-1 hover:bg-fundo" href={l.link_maps} target="_blank" rel="noreferrer">
                                  <MapPin size={14} aria-hidden="true" /> Google Maps
                                </a>
                              )}
                              {l.site && (
                                <a className="inline-flex items-center gap-1 rounded-md border border-nevoa px-2 py-1 hover:bg-fundo" href={l.site} target="_blank" rel="noreferrer">
                                  <ExternalLink size={14} aria-hidden="true" /> {l.presenca === 'site_proprio' ? 'Site' : ROTULO_PRESENCA[l.presenca]}
                                </a>
                              )}
                              {l.instagram && l.instagram !== l.site && (
                                <a className="inline-flex items-center gap-1 rounded-md border border-nevoa px-2 py-1 hover:bg-fundo" href={l.instagram} target="_blank" rel="noreferrer">
                                  <ExternalLink size={14} aria-hidden="true" /> Instagram
                                </a>
                              )}
                            </div>
                            <p className="pt-1 text-xs text-cinza">A ficha completa, com mensagem pronta e histórico, chega na Fase 2.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!visiveis.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-cinza">
                    Nada nesta visão com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Cartao>
    </div>
  );
}
