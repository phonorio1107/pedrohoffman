import { format, startOfDay } from 'date-fns';
import { ChevronRight, FileUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { classeBotao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Cartao } from '@/components/ui/cartao';
import { Etiqueta, type Tom } from '@/components/ui/etiqueta';
import { repo } from '@/lib/dados';
import { LIMITE_PILOTOS, META_PADRAO, montarFila, motivoCurto, type TipoFila } from '@/lib/fila';
import { gravarMeta, guardarFila, lerMeta } from '@/lib/sessao';
import type { Lead } from '@/lib/tipos';
import { cn } from '@/lib/utils';

const FILTROS: { id: 'todos' | TipoFila; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Tudo' },
  { id: 'primeiro', rotulo: 'Primeiro contato' },
  { id: 'previa', rotulo: 'Prévias' },
  { id: 'retorno', rotulo: 'Retornos' },
];
const TOM: Record<TipoFila, Tom> = { retorno: 'atencao', previa: 'marinho', primeiro: 'neutro' };

/** Degraus da meta: um bloco por mensagem, cada um um pouco mais alto. */
function DegrausDaMeta({ feitas, meta }: { feitas: number; meta: number }) {
  const n = Math.min(meta, 30);
  return (
    <div className="flex h-10 items-end gap-1" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={cn('flex-1 rounded-t-sm', i < feitas ? 'bg-white' : 'bg-white/20')} style={{ height: `${30 + (70 * (i + 1)) / n}%` }} />
      ))}
    </div>
  );
}

export function Hoje() {
  const navegar = useNavigate();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [enviadas, setEnviadas] = useState(0);
  const [meta, setMeta] = useState(() => lerMeta(META_PADRAO));
  const [filtro, setFiltro] = useState<'todos' | TipoFila>('todos');
  const [erro, setErro] = useState('');
  const hoje = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    Promise.all([repo.leads(), repo.eventosDesde(startOfDay(new Date()).toISOString(), 'mensagem enviada')])
      .then(([l, e]) => {
        setLeads(l);
        setEnviadas(new Set(e.map((x) => x.lead_id)).size);
      })
      .catch((e) => setErro((e as Error).message));
  }, []);

  const fila = useMemo(() => (leads ? montarFila(leads, hoje, enviadas, meta) : null), [leads, hoje, enviadas, meta]);
  const itens = useMemo(() => (fila ? fila.itens.filter((i) => filtro === 'todos' || i.tipo === filtro) : []), [fila, filtro]);

  if (erro) return <p className="rounded-md bg-erro-fundo px-3 py-2 text-sm text-erro">{erro}</p>;
  if (!leads || !fila) return <p className="text-sm text-cinza">Carregando…</p>;

  const abrir = (id: string) => {
    guardarFila(fila.itens.map((i) => i.lead.id));
    navegar(`/leads/${id}`);
  };
  const dataBruta = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const dataLonga = dataBruta.charAt(0).toUpperCase() + dataBruta.slice(1);
  const contagem = { todos: fila.itens.length, primeiro: fila.primeiros, previa: fila.previas, retorno: fila.retornos };

  if (!leads.length)
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Hoje</h1>
        <Cartao className="mt-6 flex flex-col items-start gap-3 p-6">
          <p className="font-titulo text-lg font-semibold">A fila começa com uma planilha.</p>
          <p className="text-sm text-grafite">Importe as empresas do Google Maps e a fila do dia se monta sozinha.</p>
          <Link to="/importar" className={classeBotao('principal')}>
            <FileUp size={16} aria-hidden="true" /> Importar planilha
          </Link>
        </Cartao>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">Hoje</h1>
      <p className="mt-1 text-sm text-grafite">{dataLonga}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_220px]">
        <div className="rounded-cartao bg-tinta p-5 text-white">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.1em] text-[#C3C3CA]">Mensagens de hoje</p>
            <label className="flex items-center gap-2 text-xs text-[#C3C3CA]">
              Meta
              <Campo
                type="number"
                min={1}
                max={100}
                value={meta}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(100, Number(e.target.value) || META_PADRAO));
                  setMeta(n);
                  gravarMeta(n);
                }}
                className="h-8 w-16 border-white/30 bg-white/10 px-2 text-white"
                aria-label="Meta diária de mensagens"
              />
            </label>
          </div>
          <p className="num mt-1 font-titulo text-4xl font-bold">
            {enviadas} <span className="text-xl font-semibold text-[#C3C3CA]">de {meta}</span>
          </p>
          <div className="mt-3">
            <DegrausDaMeta feitas={enviadas} meta={meta} />
          </div>
          <p className="mt-2 text-sm text-[#C3C3CA]">
            {fila.restantes === 0 ? 'Meta batida. Agora só retornos e prévias.' : `Faltam ${fila.restantes} primeiros contatos para a meta.`}
          </p>
        </div>
        <Cartao className="flex flex-col justify-between p-5">
          <p className="text-xs uppercase tracking-[0.1em] text-cinza">Pilotos ativos</p>
          <p className="num font-titulo text-4xl font-bold">
            {fila.pilotos} <span className="text-xl font-semibold text-cinza">de {LIMITE_PILOTOS}</span>
          </p>
          <p className={cn('text-sm', fila.pilotos >= LIMITE_PILOTOS ? 'text-atencao' : 'text-grafite')}>
            {fila.pilotos >= LIMITE_PILOTOS ? 'Limite atingido: termine um piloto antes de abrir outro.' : `Cabem mais ${LIMITE_PILOTOS - fila.pilotos}.`}
          </p>
        </Cartao>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-nevoa" role="tablist" aria-label="Filtro da fila">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filtro === f.id}
            onClick={() => setFiltro(f.id)}
            className={cn('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm', filtro === f.id ? 'border-tinta font-semibold' : 'border-transparent text-cinza hover:text-tinta')}
          >
            {f.rotulo} <span className="num text-cinza">{contagem[f.id]}</span>
          </button>
        ))}
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {itens.map(({ lead, tipo, acao }) => (
          <li key={lead.id}>
            <button onClick={() => abrir(lead.id)} className="flex w-full items-center gap-4 rounded-cartao border border-nevoa bg-papel p-4 text-left hover:border-[#8A8A92]">
              <span className="num grid h-12 w-12 shrink-0 place-items-center rounded-campo bg-tinta font-titulo text-lg font-bold text-white" title={`Nota ${lead.nota_oportunidade}`}>
                {lead.nota_oportunidade}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{lead.nome}</span>
                <span className="block truncate text-sm text-cinza">{motivoCurto(lead)}</span>
                <Etiqueta tom={TOM[tipo]} className="mt-1">
                  {acao}
                </Etiqueta>
              </span>
              <ChevronRight size={20} className="shrink-0 text-cinza" aria-hidden="true" />
            </button>
          </li>
        ))}
        {!itens.length && (
          <li>
            <Cartao className="p-6 text-sm text-grafite">
              {filtro === 'todos' ? 'Nada para hoje. Importe mais empresas ou aumente a meta.' : 'Nada nesta parte da fila.'}
            </Cartao>
          </li>
        )}
      </ol>
    </div>
  );
}
