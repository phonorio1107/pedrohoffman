// Reels da Pedro Hoffman (1080x1920): cenas curtas, tela + narração, chamada no fim.
// O roteiro vem de um video.json (veja motor/README.md).
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Chapeu, FONTE_TEXTO, FONTE_TITULO, Fundo, HANDLE, Logo, Palco, Rico, SEGURO, Simbolo, Sobe, TEMA } from './marca';
import { Vinheta } from './Vinheta';

type Base = { duracao: number; fundo?: Fundo; chapeu?: string };
export type Cena =
  | (Base & { tipo: 'gancho'; titulo: string })
  | (Base & { tipo: 'texto'; titulo: string; texto?: string })
  | (Base & { tipo: 'lista'; titulo: string; itens: string[] })
  | (Base & { tipo: 'tela'; titulo?: string; arquivo?: string; inicio?: number; mudo?: boolean })
  | (Base & { tipo: 'chamada'; titulo?: string; texto?: string; botao?: string })
  | (Base & { tipo: 'vinheta' });

export type Legenda = { de: number; ate: number; texto: string };

export type RoteiroReels = {
  cenas: Cena[];
  legendas?: Legenda[];
  narracao?: string;
  trilha?: string;
  volumeTrilha?: number;
};

export const FPS = 30;
export const duracaoTotal = (r: RoteiroReels) => Math.max(1, Math.round(r.cenas.reduce((s, c) => s + c.duracao, 0) * FPS));

const temCaixa = (fundo: Fundo, extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: TEMA[fundo].vidro,
  border: `1.5px solid ${TEMA[fundo].vidroBorda}`,
  backdropFilter: 'blur(28px)',
  borderRadius: 32,
  ...extra,
});

const Area: React.FC<{ comLegenda: boolean; children: React.ReactNode; centro?: boolean }> = ({ comLegenda, children, centro }) => (
  <div
    style={{
      position: 'absolute',
      top: SEGURO.topo,
      left: SEGURO.lado,
      right: SEGURO.lado,
      bottom: comLegenda ? SEGURO.base + 200 : SEGURO.base,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: centro ? 'center' : 'flex-start',
      gap: 48,
    }}
  >
    {children}
  </div>
);

const titulo = (tamanho: number): React.CSSProperties => ({
  fontFamily: FONTE_TITULO,
  fontWeight: 700,
  fontSize: tamanho,
  lineHeight: 0.98,
  letterSpacing: '-0.05em',
  margin: 0,
});

const CenaView: React.FC<{ cena: Cena; fundo: Fundo; lado: 'a' | 'b'; comLegenda: boolean }> = ({ cena, fundo, lado, comLegenda }) => {
  const frame = useCurrentFrame();
  const t = TEMA[fundo];

  if (cena.tipo === 'vinheta') return <Vinheta fundo={fundo} />;

  if (cena.tipo === 'gancho') {
    return (
      <Palco fundo={fundo} lado={lado}>
        <Area comLegenda={comLegenda} centro>
          <Sobe><Chapeu texto={cena.chapeu} fundo={fundo} /></Sobe>
          <Sobe atraso={3}><h1 style={titulo(128)}><Rico texto={cena.titulo} fundo={fundo} /></h1></Sobe>
        </Area>
      </Palco>
    );
  }

  if (cena.tipo === 'texto') {
    return (
      <Palco fundo={fundo} lado={lado}>
        <Area comLegenda={comLegenda} centro>
          <Sobe><Chapeu texto={cena.chapeu} fundo={fundo} /></Sobe>
          <Sobe atraso={3}><h2 style={titulo(104)}><Rico texto={cena.titulo} fundo={fundo} /></h2></Sobe>
          {cena.texto ? (
            <Sobe atraso={9}><p style={{ margin: 0, fontSize: 44, lineHeight: 1.35, color: t.apoio }}><Rico texto={cena.texto} fundo={fundo} /></p></Sobe>
          ) : null}
        </Area>
      </Palco>
    );
  }

  if (cena.tipo === 'lista') {
    return (
      <Palco fundo={fundo} lado={lado}>
        <Area comLegenda={comLegenda} centro>
          <Sobe><Chapeu texto={cena.chapeu} fundo={fundo} /></Sobe>
          <Sobe atraso={3}><h2 style={titulo(96)}><Rico texto={cena.titulo} fundo={fundo} /></h2></Sobe>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {cena.itens.map((item, i) => (
              <Sobe key={i} atraso={12 + i * 8}>
                <div style={temCaixa(fundo, { display: 'flex', alignItems: 'center', gap: 28, padding: '34px 38px', fontSize: 42, lineHeight: 1.25, fontWeight: 500 })}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: t.texto, flexShrink: 0 }} />
                  <span><Rico texto={item} fundo={fundo} /></span>
                </div>
              </Sobe>
            ))}
          </div>
        </Area>
      </Palco>
    );
  }

  if (cena.tipo === 'tela') {
    const zoom = interpolate(frame, [0, cena.duracao * FPS], [1, 1.06], { extrapolateRight: 'clamp' });
    return (
      <Palco fundo={fundo} lado={lado}>
        <Area comLegenda={comLegenda}>
          {cena.titulo ? (
            <Sobe><h2 style={titulo(80)}><Rico texto={cena.titulo} fundo={fundo} /></h2></Sobe>
          ) : null}
          <Sobe atraso={4} style={{ flexGrow: 1, display: 'flex' }}>
            <div style={temCaixa(fundo, { flexGrow: 1, overflow: 'hidden', padding: 14, display: 'flex' })}>
              <div style={{ flexGrow: 1, borderRadius: 22, overflow: 'hidden', background: '#0E0E10', position: 'relative' }}>
                {cena.arquivo ? (
                  <OffthreadVideo
                    src={staticFile(cena.arquivo)}
                    startFrom={Math.round((cena.inicio ?? 0) * FPS)}
                    muted={cena.mudo ?? true}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${zoom})` }}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, color: '#A9B4C8', fontSize: 34 }}>
                    <Simbolo tamanho={96} cor="#3A3A40" />
                    Gravação de tela entra aqui
                  </div>
                )}
              </div>
            </div>
          </Sobe>
        </Area>
      </Palco>
    );
  }

  // chamada
  return (
    <Palco fundo={fundo} lado={lado}>
      <Area comLegenda={false}>
        <Sobe><Logo fonte={40} cor={t.texto} /></Sobe>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
          <Sobe atraso={4}><h2 style={titulo(132)}><Rico texto={cena.titulo ?? 'Sua rotina,\num degrau\n*acima.*'} fundo={fundo} /></h2></Sobe>
          {cena.texto ? <Sobe atraso={10}><p style={{ margin: 0, fontSize: 42, lineHeight: 1.35, color: t.apoio }}>{cena.texto}</p></Sobe> : null}
          <Sobe atraso={16}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 16,
                minHeight: 100,
                padding: '0 48px',
                borderRadius: 999,
                background: 'linear-gradient(90deg,#1E3F73,#4A7BD0)',
                border: '1.5px solid rgba(201,218,246,.45)',
                color: '#FFFFFF',
                fontSize: 40,
                fontWeight: 600,
              }}
            >
              {cena.botao ?? 'Mande "DOR" no direct'}
            </span>
          </Sobe>
          <Sobe atraso={20}><span style={{ fontSize: 32, color: '#A9B4C8' }}>{HANDLE}</span></Sobe>
        </div>
      </Area>
    </Palco>
  );
};

// Legenda da narração: caixa escura discreta logo acima da área da interface.
const Legendas: React.FC<{ legendas: Legenda[] }> = ({ legendas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const atual = legendas.find((l) => s >= l.de && s < l.ate);
  if (!atual) return null;
  const p = interpolate(s, [atual.de, atual.de + 0.12], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: SEGURO.lado, right: SEGURO.lado, bottom: SEGURO.base + 30, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          background: 'rgba(14,14,16,.82)',
          border: '1.5px solid rgba(255,255,255,.14)',
          color: '#FFFFFF',
          borderRadius: 24,
          padding: '20px 30px',
          fontSize: 46,
          lineHeight: 1.25,
          fontWeight: 600,
          textAlign: 'center',
          opacity: p,
          transform: `scale(${0.96 + 0.04 * p})`,
        }}
      >
        <Rico texto={atual.texto} fundo="escuro" />
      </div>
    </div>
  );
};

export const Reels: React.FC<RoteiroReels> = (r) => {
  let inicio = 0;
  let anterior: Fundo = 'claro';
  const comLegenda = Boolean(r.legendas?.length);
  return (
    <AbsoluteFill style={{ background: '#0E0E10', fontFamily: FONTE_TEXTO }}>
      {r.cenas.map((cena, i) => {
        // Fundos alternam sozinhos (gancho e chamada escuros), a menos que a cena diga.
        const fundo: Fundo = cena.fundo ?? (cena.tipo === 'gancho' || cena.tipo === 'chamada' || cena.tipo === 'vinheta' ? 'escuro' : anterior === 'escuro' ? 'claro' : 'escuro');
        anterior = fundo;
        const de = inicio;
        const dur = Math.round(cena.duracao * FPS);
        inicio += dur;
        return (
          <Sequence key={i} from={de} durationInFrames={dur}>
            <CenaView cena={cena} fundo={fundo} lado={i % 2 === 0 ? 'a' : 'b'} comLegenda={comLegenda && cena.tipo !== 'chamada' && cena.tipo !== 'vinheta'} />
          </Sequence>
        );
      })}
      {comLegenda ? <Legendas legendas={r.legendas!} /> : null}
      {r.narracao ? <Audio src={staticFile(r.narracao)} /> : null}
      {r.trilha ? <Audio src={staticFile(r.trilha)} volume={r.volumeTrilha ?? 0.12} /> : null}
    </AbsoluteFill>
  );
};
