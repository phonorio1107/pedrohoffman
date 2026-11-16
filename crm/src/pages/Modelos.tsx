import { RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Botao } from '@/components/ui/botao';
import { Rotulo, Selecao } from '@/components/ui/campo';
import { Cartao } from '@/components/ui/cartao';
import { Etiqueta } from '@/components/ui/etiqueta';
import { repo } from '@/lib/dados';
import { LEAD_EXEMPLO, MODELOS_PADRAO, VARIAVEIS, partesDaMensagem, valoresDoLead } from '@/lib/mensagem';
import { CANAIS, type Canal, type Modelo, type Nicho } from '@/lib/tipos';
import { cn } from '@/lib/utils';

export function Modelos() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [nichos, setNichos] = useState<Nicho[]>([]);
  const [nichoId, setNichoId] = useState('');
  const [canal, setCanal] = useState<Canal>('WhatsApp');
  const [texto, setTexto] = useState('');
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);

  const recarregar = async () => {
    const [m, n] = await Promise.all([repo.modelos(), repo.nichos()]);
    setModelos(m);
    setNichos(n);
  };
  useEffect(() => {
    recarregar().catch((e) => setErro((e as Error).message));
  }, []);

  const salvo = useMemo(() => modelos.find((m) => m.canal === canal && (m.nicho_id ?? '') === nichoId), [modelos, canal, nichoId]);
  const geral = useMemo(() => modelos.find((m) => m.canal === canal && !m.nicho_id), [modelos, canal]);
  // Ao trocar de nicho ou canal, mostra o que vale ali: o modelo do nicho, o geral ou o padrão.
  const base = salvo?.texto ?? (nichoId ? geral?.texto : undefined) ?? MODELOS_PADRAO[canal];
  useEffect(() => {
    setTexto(base);
  }, [base]);

  const partes = partesDaMensagem(texto, valoresDoLead({ ...LEAD_EXEMPLO }));
  const alterado = texto !== base || (!salvo && texto.trim() !== '');

  function inserir(chave: string) {
    const el = area.current;
    const marca = `{{${chave}}}`;
    if (!el) return setTexto((t) => t + marca);
    const { selectionStart: a, selectionEnd: b } = el;
    setTexto(texto.slice(0, a) + marca + texto.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + marca.length, a + marca.length);
    });
  }

  async function salvar() {
    setErro('');
    try {
      const nome = nichoId ? `${nichos.find((n) => n.id === nichoId)?.nome ?? 'Nicho'} · ${canal}` : `Geral · ${canal}`;
      await repo.salvarModelo({ nicho_id: nichoId || null, canal, nome, texto: texto.trim() });
      await recarregar();
      setAviso('Modelo salvo.');
      setTimeout(() => setAviso(''), 3000);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function restaurar() {
    if (salvo) await repo.apagarModelo(salvo.id);
    await recarregar();
    setTexto(nichoId ? (geral?.texto ?? MODELOS_PADRAO[canal]) : MODELOS_PADRAO[canal]);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold">Modelos de mensagem</h1>
      <p className="mt-1 text-sm text-grafite">
        O texto que aparece na ficha de cada lead. Sem modelo do nicho, vale o geral; sem o geral, vale o padrão.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-[260px_1fr]">
        <div>
          <Rotulo htmlFor="nicho-modelo">Nicho</Rotulo>
          <Selecao id="nicho-modelo" value={nichoId} onChange={(e) => setNichoId(e.target.value)}>
            <option value="">Geral (todos os nichos)</option>
            {nichos.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nome}
              </option>
            ))}
          </Selecao>
        </div>
        <div className="flex items-end gap-1 border-b border-nevoa" role="tablist" aria-label="Canal">
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
      </div>

      {erro && <p className="mt-3 rounded-md bg-erro-fundo px-3 py-2 text-sm text-erro">{erro}</p>}

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <Cartao className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Texto</h2>
            <Etiqueta tom={salvo ? 'sucesso' : 'neutro'}>{salvo ? 'Modelo salvo' : nichoId && geral ? 'Usando o geral' : 'Usando o padrão'}</Etiqueta>
          </div>
          <label htmlFor="texto-modelo" className="sr-only">
            Texto do modelo
          </label>
          <textarea
            id="texto-modelo"
            ref={area}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={11}
            className="mt-3 w-full rounded-campo border border-[#8A8A92] bg-papel p-3 text-[15px] leading-relaxed"
          />
          <p className="mt-3 text-xs uppercase tracking-[0.08em] text-cinza">Inserir dado do lead</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {VARIAVEIS.map((v) => (
              <button key={v.chave} onClick={() => inserir(v.chave)} className="rounded-md border border-nevoa bg-fundo px-2 py-1 text-xs hover:bg-nevoa/60" title={v.rotulo}>
                {v.rotulo}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <Botao variante="fantasma" onClick={restaurar} disabled={!salvo}>
              <RotateCcw size={16} aria-hidden="true" /> Voltar ao anterior
            </Botao>
            <div className="flex items-center gap-3">
              {aviso && (
                <span role="status" className="text-sm text-sucesso">
                  {aviso}
                </span>
              )}
              <Botao variante="principal" onClick={salvar} disabled={!alterado || !texto.trim()}>
                Salvar modelo
              </Botao>
            </div>
          </div>
        </Cartao>

        <Cartao className="p-5">
          <h2 className="text-lg font-semibold">Prévia com um lead de exemplo</h2>
          <p className="text-xs text-cinza">Empresa inventada: {LEAD_EXEMPLO.nome}, {LEAD_EXEMPLO.cidade}.</p>
          <p className="mt-3 whitespace-pre-wrap rounded-campo bg-fundo p-4 text-[15px] leading-relaxed">
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
        </Cartao>
      </div>
    </div>
  );
}
