import { Check, FileSpreadsheet, Undo2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Botao } from '@/components/ui/botao';
import { Campo, Rotulo, Selecao } from '@/components/ui/campo';
import { Cartao } from '@/components/ui/cartao';
import { Etiqueta } from '@/components/ui/etiqueta';
import { CAMPOS, mapearColunas, type Mapa } from '@/lib/colunas';
import { podeDesfazer, repo } from '@/lib/dados';
import { analisarImportacao, lerArquivo, linhaParaLead, nomeSugeridoDoLote, type Planilha } from '@/lib/importar';
import type { Lead, Lote, Nicho } from '@/lib/tipos';
import { cn, dataBR } from '@/lib/utils';

const ETAPAS = ['Arquivo', 'Colunas', 'Revisão'] as const;

function Etapas({ atual }: { atual: number }) {
  // Degraus: cada etapa um pouco mais alta que a anterior.
  return (
    <ol className="flex items-end gap-2" aria-label="Etapas">
      {ETAPAS.map((e, i) => (
        <li key={e} className="flex-1" aria-current={i === atual ? 'step' : undefined}>
          <div
            className={cn('rounded-t-md', i < atual ? 'bg-grafite' : i === atual ? 'bg-tinta' : 'bg-nevoa')}
            style={{ height: 8 + i * 8 }}
          />
          <p className={cn('mt-2 text-sm', i === atual ? 'font-semibold text-tinta' : 'text-cinza')}>
            {i + 1}. {e}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function Importar() {
  const navegar = useNavigate();
  const entrada = useRef<HTMLInputElement>(null);
  const [etapa, setEtapa] = useState(0);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [planilha, setPlanilha] = useState<Planilha | null>(null);
  const [mapa, setMapa] = useState<Mapa | null>(null);
  const [existentes, setExistentes] = useState<Lead[]>([]);
  const [nichos, setNichos] = useState<Nicho[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [nomeLote, setNomeLote] = useState('');
  const [nichoId, setNichoId] = useState('');
  const [novoNicho, setNovoNicho] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const recarregar = () => {
    repo.leads().then(setExistentes);
    repo.nichos().then(setNichos);
    repo.lotes().then(setLotes);
  };
  useEffect(recarregar, []);

  async function escolher(f: File | undefined) {
    if (!f) return;
    setErro('');
    try {
      const p = await lerArquivo(f);
      if (!p.linhas.length) throw new Error('A planilha está vazia.');
      const m = mapearColunas(p.cabecalhos);
      setArquivo(f);
      setPlanilha(p);
      setMapa(m);
      setNomeLote(nomeSugeridoDoLote(p.linhas.map((l) => linhaParaLead(l, m)).filter((d) => d !== null)));
      setEtapa(1);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  const analise = useMemo(() => (planilha && mapa && mapa.nome ? analisarImportacao(planilha, mapa, existentes) : null), [planilha, mapa, existentes]);
  const exemplo = (coluna: string | null) => {
    if (!coluna || !planilha) return '';
    const v = planilha.linhas.find((l) => l[coluna] !== null && l[coluna] !== undefined && l[coluna] !== '')?.[coluna];
    return v === undefined || v === null ? '' : String(v).slice(0, 60);
  };

  async function importar() {
    if (!analise || !arquivo) return;
    setSalvando(true);
    setErro('');
    try {
      let nicho = nichoId || null;
      if (nichoId === 'novo') {
        if (!novoNicho.trim()) throw new Error('Dê um nome para o nicho novo.');
        nicho = (await repo.criarNicho(novoNicho.trim())).id;
      }
      const lote = await repo.importar({ nome: nomeLote.trim() || arquivo.name, nicho_id: nicho, arquivo: arquivo.name }, analise);
      navegar(`/leads?lote=${lote.id}`);
    } catch (e) {
      setErro((e as Error).message);
      setSalvando(false);
    }
  }

  async function desfazer(l: Lote) {
    if (confirmando !== l.id) {
      setConfirmando(l.id);
      return;
    }
    setConfirmando(null);
    try {
      await repo.desfazerLote(l.id);
      recarregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  const r = analise?.resumo;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">Importar planilha</h1>
      <p className="mt-1 text-sm text-grafite">CSV ou Excel exportado do Outscraper (Raspador do Google Maps) ou de outra ferramenta.</p>

      <div className="mt-6">
        <Etapas atual={etapa} />
      </div>

      {erro && <p className="mt-4 rounded-md bg-erro-fundo px-3 py-2 text-sm text-erro">{erro}</p>}

      {etapa === 0 && (
        <Cartao
          className={cn('mt-6 flex flex-col items-center gap-3 border-2 border-dashed p-10 text-center', arrastando && 'border-tinta bg-fundo')}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            escolher(e.dataTransfer.files[0]);
          }}
        >
          <FileSpreadsheet size={36} className="text-grafite" aria-hidden="true" />
          <p className="font-titulo text-lg font-semibold">Arraste a planilha aqui</p>
          <p className="text-sm text-cinza">ou</p>
          <Botao variante="principal" onClick={() => entrada.current?.click()}>
            <Upload size={16} aria-hidden="true" /> Escolher arquivo
          </Botao>
          <input ref={entrada} type="file" accept=".csv,.xlsx,.txt" className="sr-only" onChange={(e) => escolher(e.target.files?.[0])} aria-label="Escolher planilha" />
          <p className="max-w-md text-xs text-cinza">No Outscraper, use só o Raspador do Google Maps, sem pacote de enriquecimento: sai mais rápido, mais barato e mais limpo.</p>
        </Cartao>
      )}

      {etapa === 1 && planilha && mapa && (
        <Cartao className="mt-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-nevoa p-5">
            <div>
              <h2 className="text-xl font-semibold">Colunas</h2>
              <p className="text-sm text-grafite">
                {arquivo?.name} · {planilha.linhas.length} linhas · {planilha.cabecalhos.length} colunas. Reconheci sozinho o que deu; confira e ajuste.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-fundo text-left text-xs uppercase tracking-[0.08em] text-cinza">
                <tr>
                  <th className="px-5 py-2 font-semibold">Campo do CRM</th>
                  <th className="px-5 py-2 font-semibold">Coluna da planilha</th>
                  <th className="px-5 py-2 font-semibold">Exemplo</th>
                </tr>
              </thead>
              <tbody>
                {CAMPOS.map((c) => (
                  <tr key={c.chave} className="border-t border-nevoa">
                    <td className="px-5 py-2 font-medium">
                      {c.rotulo}
                      {'obrigatorio' in c && <span className="ml-1 text-erro">*</span>}
                    </td>
                    <td className="px-5 py-2">
                      <Selecao
                        aria-label={`Coluna para ${c.rotulo}`}
                        value={mapa[c.chave] ?? ''}
                        onChange={(e) => setMapa({ ...mapa, [c.chave]: e.target.value || null })}
                        className="h-9"
                      >
                        <option value="">Não usar</option>
                        {planilha.cabecalhos.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </Selecao>
                    </td>
                    <td className="max-w-[260px] truncate px-5 py-2 text-cinza">{exemplo(mapa[c.chave])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between gap-2 border-t border-nevoa p-5">
            <Botao variante="fantasma" onClick={() => setEtapa(0)}>
              Trocar arquivo
            </Botao>
            <Botao variante="principal" disabled={!mapa.nome} onClick={() => setEtapa(2)}>
              Revisar
            </Botao>
          </div>
        </Cartao>
      )}

      {etapa === 2 && analise && r && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <Cartao className="p-5">
            <h2 className="text-xl font-semibold">Revisão</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { n: r.novos, t: 'Novos na fila', tom: 'text-tinta' },
                { n: r.atualizados, t: 'Já existiam (atualizar)', tom: 'text-grafite' },
                { n: r.semContato, t: 'Sem contato', tom: 'text-atencao' },
                { n: r.redes + r.fechados, t: 'Descartados', tom: 'text-cinza' },
              ].map((c) => (
                <div key={c.t} className="rounded-campo bg-fundo p-3">
                  <p className={cn('num font-titulo text-3xl font-bold', c.tom)}>{c.n}</p>
                  <p className="text-xs text-grafite">{c.t}</p>
                </div>
              ))}
            </div>
            <ul className="mt-5 space-y-2 text-sm text-grafite">
              <li>
                Oportunidade dos novos: <Etiqueta tom="escuro">Alta {r.alta}</Etiqueta> <Etiqueta tom="marinho">Média {r.media}</Etiqueta>{' '}
                <Etiqueta>Baixa {r.baixa}</Etiqueta>
              </li>
              {r.redes > 0 && <li>{r.redes} rede(s) ou franquia(s) descartada(s): quem decide fica na matriz.</li>}
              {r.fechados > 0 && <li>{r.fechados} fechado(s) no Google, descartado(s).</li>}
              {r.semContato > 0 && <li>{r.semContato} sem telefone nem e-mail: entram fora da fila.</li>}
              {analise.repetidasNoArquivo > 0 && <li>{analise.repetidasNoArquivo} linha(s) repetida(s) no próprio arquivo, juntada(s).</li>}
              {analise.ignoradas > 0 && <li>{analise.ignoradas} linha(s) sem nome, ignorada(s).</li>}
            </ul>
          </Cartao>

          <Cartao className="flex flex-col gap-4 p-5">
            <div>
              <Rotulo htmlFor="lote">Nome do lote</Rotulo>
              <Campo id="lote" value={nomeLote} onChange={(e) => setNomeLote(e.target.value)} />
            </div>
            <div>
              <Rotulo htmlFor="nicho">Nicho</Rotulo>
              <Selecao id="nicho" value={nichoId} onChange={(e) => setNichoId(e.target.value)}>
                <option value="">Ainda não definido</option>
                {nichos.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nome}
                  </option>
                ))}
                <option value="novo">+ Novo nicho…</option>
              </Selecao>
              {nichoId === 'novo' && (
                <Campo className="mt-2" placeholder="Ex.: Hamburguerias" value={novoNicho} onChange={(e) => setNovoNicho(e.target.value)} aria-label="Nome do nicho novo" />
              )}
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <Botao variante="principal" onClick={importar} disabled={salvando || r.novos + r.atualizados + r.semContato + r.redes + r.fechados === 0}>
                <Check size={16} aria-hidden="true" />
                {salvando ? 'Importando…' : `Importar ${analise.novos.length + analise.atualizacoes.length} leads`}
              </Botao>
              <Botao variante="fantasma" onClick={() => setEtapa(1)}>
                Voltar às colunas
              </Botao>
            </div>
          </Cartao>
        </div>
      )}

      {lotes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Lotes importados</h2>
          <Cartao className="mt-3 divide-y divide-nevoa">
            {lotes.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{l.nome}</p>
                  <p className="text-xs text-cinza">
                    {dataBR(l.criado_em)} · {l.arquivo} · {l.novos} novos · {l.atualizados} atualizados · {l.descartados} descartados
                  </p>
                </div>
                {l.desfeito_em ? (
                  <Etiqueta>Desfeito em {dataBR(l.desfeito_em)}</Etiqueta>
                ) : podeDesfazer(l) ? (
                  <span className="flex items-center gap-2">
                    {confirmando === l.id && <span className="text-xs text-erro">Apaga os leads deste lote.</span>}
                    <Botao variante="fantasma" className={cn('h-8 px-2', confirmando === l.id && 'bg-erro-fundo text-erro')} onClick={() => desfazer(l)}>
                      <Undo2 size={14} aria-hidden="true" /> {confirmando === l.id ? 'Confirmar' : 'Desfazer'}
                    </Botao>
                  </span>
                ) : null}
              </div>
            ))}
          </Cartao>
        </section>
      )}
    </div>
  );
}
