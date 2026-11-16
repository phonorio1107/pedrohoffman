import { addDays, format } from 'date-fns';
import { ArrowLeft, Copy, ExternalLink, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Botao, classeBotao } from '@/components/ui/botao';
import { Campo, Rotulo, Selecao } from '@/components/ui/campo';
import { Cartao } from '@/components/ui/cartao';
import { Etiqueta, type Tom } from '@/components/ui/etiqueta';
import { repo } from '@/lib/dados';
import { formatarHorario } from '@/lib/horario';
import { MODELOS_PADRAO, partesDaMensagem, preencher, valoresDoLead } from '@/lib/mensagem';
import { formatarTelefone, linkWhatsApp } from '@/lib/telefone';
import { CANAIS, ROTULO_PRESENCA, STATUS, type AtualizacaoLead, type Canal, type EventoLead, type Lead, type Modelo, type Nicho, type Status, type TipoEvento } from '@/lib/tipos';
import { cn, dataBR, numeroBR } from '@/lib/utils';

const TOM_STATUS: Record<Status, Tom> = {
  Novo: 'neutro',
  Contatado: 'marinho',
  Respondeu: 'marinho',
  'Prévia enviada': 'marinho',
  Piloto: 'atencao',
  Cliente: 'sucesso',
  'Sem contato': 'atencao',
  Descartado: 'neutro',
};

const EVENTO_DO_STATUS: Partial<Record<Status, TipoEvento>> = { Respondeu: 'respondeu', 'Prévia enviada': 'prévia enviada' };

const hojeMais = (dias: number) => format(addDays(new Date(), dias), 'yyyy-MM-dd');

export function Ficha() {
  const { id = '' } = useParams();
  const [lead, setLead] = useState<Lead | null | undefined>(undefined);
  const [eventos, setEventos] = useState<EventoLead[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [nichos, setNichos] = useState<Nicho[]>([]);
  const [canal, setCanal] = useState<Canal>('WhatsApp');
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [passo, setPasso] = useState('');
  const [dataPasso, setDataPasso] = useState('');
  const [obs, setObs] = useState('');
  const [cobrarEm, setCobrarEm] = useState('2');

  const carregar = useCallback(async () => {
    try {
      const [l, e, m, n] = await Promise.all([repo.lead(id), repo.eventos(id), repo.modelos(), repo.nichos()]);
      setLead(l);
      setEventos(e);
      setModelos(m);
      setNichos(n);
      if (l) {
        setPasso(l.proximo_passo ?? '');
        setDataPasso(l.data_proximo_passo ?? '');
        setObs(l.observacoes ?? '');
      }
    } catch (e) {
      setErro((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const avisar = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(''), 4000);
  };

  async function salvar(mudanca: AtualizacaoLead, evento?: { tipo: TipoEvento; texto: string | null }) {
    setErro('');
    try {
      const atualizado = await repo.atualizarLead(id, mudanca);
      if (evento) await repo.registrarEvento(id, evento.tipo, evento.texto);
      setLead(atualizado);
      // Os campos da tela acompanham o que foi salvo (ex.: "Cobrar resposta" depois de marcar como enviada).
      setPasso(atualizado.proximo_passo ?? '');
      setDataPasso(atualizado.data_proximo_passo ?? '');
      setEventos(await repo.eventos(id));
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  const modelo = useMemo(() => {
    if (!lead) return null;
    const doNicho = modelos.find((m) => m.canal === canal && m.nicho_id && m.nicho_id === lead.nicho_id);
    if (doNicho) return { texto: doNicho.texto, origem: `Modelo do nicho ${nichos.find((n) => n.id === lead.nicho_id)?.nome ?? ''}` };
    const geral = modelos.find((m) => m.canal === canal && !m.nicho_id);
    if (geral) return { texto: geral.texto, origem: 'Modelo geral' };
    return { texto: MODELOS_PADRAO[canal], origem: 'Modelo padrão' };
  }, [lead, modelos, canal, nichos]);

  if (erro && lead === undefined) return <p className="rounded-md bg-erro-fundo px-3 py-2 text-sm text-erro">{erro}</p>;
  if (lead === undefined) return <p className="text-sm text-cinza">Carregando…</p>;
  if (lead === null)
    return (
      <div className="mx-auto max-w-3xl">
        <Link to="/leads" className="text-sm text-grafite underline">
          Voltar para Leads
        </Link>
        <Cartao className="mt-4 p-6">Lead não encontrado. Ele pode ter sido desfeito junto com um lote.</Cartao>
      </div>
    );

  const valores = valoresDoLead(lead);
  const partes = modelo ? partesDaMensagem(modelo.texto, valores) : [];
  const pronta = modelo ? preencher(modelo.texto, valores) : { texto: '', faltando: [] };
  const tel = lead.telefone_normalizado;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pronta.texto);
      avisar('Mensagem copiada.');
    } catch {
      avisar('Não consegui copiar. Selecione o texto e copie à mão.');
    }
  }

  async function marcarEnviada() {
    if (!lead) return;
    const dias = Number(cobrarEm);
    await salvar(
      {
        status: lead.status === 'Novo' ? 'Contatado' : lead.status,
        proximo_passo: 'Cobrar resposta',
        data_proximo_passo: hojeMais(dias),
      },
      { tipo: 'mensagem enviada', texto: `${canal}. Cobrar em ${dias} dia${dias > 1 ? 's' : ''}.` },
    );
    avisar('Registrado. Boa prospecção.');
  }

  async function mudarStatus(novo: Status) {
    if (!lead || novo === lead.status) return;
    await salvar(
      { status: novo, motivo_descarte: novo === 'Descartado' ? 'Descartado por você' : null },
      { tipo: EVENTO_DO_STATUS[novo] ?? 'status alterado', texto: `${lead.status} → ${novo}` },
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/leads" className="inline-flex items-center gap-1 text-sm text-grafite hover:text-tinta">
        <ArrowLeft size={16} aria-hidden="true" /> Leads
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">{lead.nome}</h1>
          <p className="mt-1 text-sm text-grafite">{[lead.categoria, lead.bairro, lead.cidade].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="w-full sm:w-56">
          <Rotulo htmlFor="status">Status</Rotulo>
          <Selecao id="status" value={lead.status} onChange={(e) => mudarStatus(e.target.value as Status)}>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Selecao>
        </div>
      </div>

      {erro && <p className="mt-3 rounded-md bg-erro-fundo px-3 py-2 text-sm text-erro">{erro}</p>}
      {aviso && (
        <p role="status" className="mt-3 rounded-md bg-sucesso-fundo px-3 py-2 text-sm text-sucesso">
          {aviso}
        </p>
      )}
      {lead.motivo_descarte && lead.status === 'Descartado' && <p className="mt-3 text-sm text-cinza">Motivo: {lead.motivo_descarte}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="rounded-cartao bg-tinta p-5 text-white">
            <p className="text-xs uppercase tracking-[0.1em] text-[#C3C3CA]">Nota de oportunidade</p>
            <p className="num font-titulo text-5xl font-bold">{lead.nota_oportunidade}</p>
            <p className="text-sm text-[#C3C3CA]">Faixa {lead.faixa}</p>
            <ul className="mt-3 space-y-1.5 border-t border-white/15 pt-3 text-sm">
              {lead.motivos.map((m) => (
                <li key={m.texto} className="flex justify-between gap-3">
                  <span className="text-[#C3C3CA]">{m.texto}</span>
                  <span className="num font-semibold">+{m.pontos}</span>
                </li>
              ))}
              {!lead.motivos.length && <li className="text-[#C3C3CA]">Nenhum ponto: site próprio e pouca movimentação.</li>}
            </ul>
          </div>

          <Cartao className="p-5">
            <h2 className="text-lg font-semibold">Dados do Google Maps</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.08em] text-cinza">Presença online</dt>
                <dd>{ROTULO_PRESENCA[lead.presenca]}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.08em] text-cinza">Google</dt>
                <dd className="num">
                  {lead.nota_google !== null ? `${numeroBR(lead.nota_google, 1)} · ` : ''}
                  {lead.avaliacoes !== null ? `${numeroBR(lead.avaliacoes)} avaliações` : 'sem avaliações'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.08em] text-cinza">Contato</dt>
                <dd className="num flex items-center gap-1">
                  {tel ? (
                    <>
                      <Phone size={14} aria-hidden="true" /> {formatarTelefone(tel)}
                      {lead.whatsapp_provavel && <Etiqueta tom="sucesso">WhatsApp provável</Etiqueta>}
                    </>
                  ) : (
                    'Sem telefone'
                  )}
                </dd>
                {lead.email && (
                  <dd className="mt-1 flex items-center gap-1 text-grafite">
                    <Mail size={14} aria-hidden="true" /> {lead.email}
                  </dd>
                )}
              </div>
              {lead.endereco && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.08em] text-cinza">Endereço</dt>
                  <dd className="flex items-start gap-1">
                    <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {lead.endereco}
                  </dd>
                </div>
              )}
              {lead.horario && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.08em] text-cinza">Horário</dt>
                  <dd className="text-grafite">{formatarHorario(lead.horario) ?? lead.horario}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {lead.link_maps && (
                <a className={classeBotao('secundario', 'h-9 px-3')} href={lead.link_maps} target="_blank" rel="noreferrer">
                  <MapPin size={14} aria-hidden="true" /> Maps
                </a>
              )}
              {lead.site && (
                <a className={classeBotao('secundario', 'h-9 px-3')} href={lead.site} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} aria-hidden="true" /> {lead.presenca === 'site_proprio' ? 'Site' : ROTULO_PRESENCA[lead.presenca]}
                </a>
              )}
              {lead.instagram && lead.instagram !== lead.site && (
                <a className={classeBotao('secundario', 'h-9 px-3')} href={lead.instagram} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} aria-hidden="true" /> Instagram
                </a>
              )}
            </div>
          </Cartao>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Cartao className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Mensagem pronta</h2>
              <Etiqueta>{modelo?.origem}</Etiqueta>
            </div>
            <div className="mt-3 flex gap-1 border-b border-nevoa" role="tablist" aria-label="Canal">
              {CANAIS.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={canal === c}
                  onClick={() => setCanal(c)}
                  className={cn('-mb-px border-b-2 px-3 py-2 text-sm', canal === c ? 'border-tinta font-semibold' : 'border-transparent text-cinza hover:text-tinta')}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded-campo bg-fundo p-4 text-[15px] leading-relaxed" data-testid="mensagem">
              {partes.map((p, i) =>
                p.tipo === 'texto' ? (
                  <span key={i}>{p.valor}</span>
                ) : p.tipo === 'variavel' ? (
                  <mark key={i} className="rounded bg-marinho-claro px-1 text-marinho">
                    {p.valor}
                  </mark>
                ) : (
                  <mark key={i} className="rounded bg-atencao-fundo px-1 text-atencao">
                    [falta {p.chave}]
                  </mark>
                ),
              )}
            </p>
            {pronta.faltando.length > 0 && (
              <p className="mt-2 text-sm text-atencao">
                Este lead não tem: {pronta.faltando.join(', ')}. Complete a mensagem antes de enviar.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {canal === 'WhatsApp' && tel && (
                <a className={classeBotao('principal')} href={linkWhatsApp(tel, pronta.texto)} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} aria-hidden="true" /> Abrir no WhatsApp
                </a>
              )}
              {canal === 'Direct' && lead.instagram && (
                <a className={classeBotao('principal')} href={lead.instagram} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} aria-hidden="true" /> Abrir o Instagram
                </a>
              )}
              <Botao onClick={copiar}>
                <Copy size={16} aria-hidden="true" /> Copiar
              </Botao>
            </div>
            {canal === 'WhatsApp' && !tel && <p className="mt-2 text-sm text-atencao">Este lead não tem telefone. Procure o contato no Maps ou no Instagram.</p>}
            {canal === 'Direct' && !lead.instagram && <p className="mt-2 text-sm text-cinza">Instagram não encontrado na planilha. Procure o perfil pelo nome da empresa.</p>}
            {canal === 'E-mail' && !lead.email && <p className="mt-2 text-sm text-cinza">Sem e-mail confiável nesta empresa.</p>}

            <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-nevoa pt-4">
              <div className="w-48">
                <Rotulo htmlFor="cobrar">Se não responder, cobrar em</Rotulo>
                <Selecao id="cobrar" value={cobrarEm} onChange={(e) => setCobrarEm(e.target.value)}>
                  <option value="1">1 dia</option>
                  <option value="2">2 dias</option>
                  <option value="4">4 dias</option>
                </Selecao>
              </div>
              <Botao onClick={marcarEnviada}>
                <Send size={16} aria-hidden="true" /> Marquei como enviada
              </Botao>
            </div>
          </Cartao>

          <Cartao className="p-5">
            <h2 className="text-lg font-semibold">Próximo passo</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
              <div>
                <Rotulo htmlFor="passo">O que fazer</Rotulo>
                <Campo id="passo" value={passo} onChange={(e) => setPasso(e.target.value)} placeholder="Ex.: Mandar a prévia" />
              </div>
              <div>
                <Rotulo htmlFor="data">Quando</Rotulo>
                <Campo id="data" type="date" value={dataPasso} onChange={(e) => setDataPasso(e.target.value)} />
              </div>
              <Botao onClick={() => salvar({ proximo_passo: passo.trim() || null, data_proximo_passo: dataPasso || null })}>Salvar</Botao>
            </div>
          </Cartao>

          <Cartao className="p-5">
            <h2 className="text-lg font-semibold">Observações</h2>
            <label htmlFor="obs" className="sr-only">
              Observações
            </label>
            <textarea
              id="obs"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              placeholder="O que você viu no Instagram, o que a pessoa respondeu..."
              className="mt-3 w-full rounded-campo border border-[#8A8A92] bg-papel p-3 text-sm placeholder:text-cinza"
            />
            <div className="mt-2 flex justify-end">
              <Botao onClick={() => salvar({ observacoes: obs.trim() || null }, obs.trim() ? { tipo: 'observação', texto: obs.trim().slice(0, 200) } : undefined)}>Salvar observação</Botao>
            </div>
          </Cartao>

          <Cartao className="p-5">
            <h2 className="text-lg font-semibold">Histórico</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {eventos.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="num w-28 shrink-0 text-xs text-cinza">
                    {dataBR(e.criado_em)} {new Date(e.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>
                    <span className="font-medium">{e.tipo.charAt(0).toUpperCase() + e.tipo.slice(1)}</span>
                    {e.texto && <span className="text-grafite"> · {e.texto}</span>}
                  </span>
                </li>
              ))}
              {!eventos.length && <li className="text-cinza">Nada registrado ainda.</li>}
            </ol>
          </Cartao>
        </div>
      </div>
    </div>
  );
}

export { TOM_STATUS };
