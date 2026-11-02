// Peças da identidade Degrau para vídeo. Mesmas regras do motor de artes.
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export type Fundo = 'claro' | 'escuro';

export const TEMA = {
  claro: {
    fundo: '#FFFFFF',
    texto: '#0E0E10',
    apoio: '#3A3A40',
    chapeu: '#1E3F73',
    destaque: 'linear-gradient(90deg,#1E3F73,#4A7BD0)',
    brilho: 'radial-gradient(circle,rgba(74,123,208,.16) 0%,rgba(169,193,234,.1) 42%,rgba(255,255,255,0) 70%)',
    vidro: 'linear-gradient(140deg,rgba(255,255,255,.85),rgba(255,255,255,.55))',
    vidroBorda: 'rgba(14,14,16,.08)',
  },
  escuro: {
    fundo: '#0E0E10',
    texto: '#FFFFFF',
    apoio: '#C3CAD6',
    chapeu: '#A9C1EA',
    destaque: 'linear-gradient(90deg,#FFFFFF 0%,#C9DAF6 40%,#6F9BE8 100%)',
    brilho: 'radial-gradient(circle,rgba(46,90,170,.34) 0%,rgba(11,31,58,.2) 42%,rgba(14,14,16,0) 70%)',
    vidro: 'linear-gradient(140deg,rgba(255,255,255,.09),rgba(255,255,255,.03))',
    vidroBorda: 'rgba(255,255,255,.16)',
  },
} as const;

export const FONTE_TITULO = "'Inter Tight', system-ui, sans-serif";
export const FONTE_TEXTO = "'Inter', system-ui, sans-serif";
export const HANDLE = '@pedrohoffman.ia';

// Área livre do Reels: 250 px no topo e 340 px embaixo ficam com a interface do Instagram.
export const SEGURO = { topo: 250, base: 340, lado: 88 };

// *palavra* vira degradê azul; \n vira quebra de linha.
export const Rico: React.FC<{ texto: string; fundo: Fundo }> = ({ texto, fundo }) => {
  const partes = texto.split(/(\*[^*]+\*|\n)/g).filter(Boolean);
  return (
    <>
      {partes.map((p, i) => {
        if (p === '\n') return <br key={i} />;
        if (p.startsWith('*') && p.endsWith('*')) {
          return (
            <span
              key={i}
              style={{
                backgroundImage: TEMA[fundo].destaque,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {p.slice(1, -1)}
            </span>
          );
        }
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </>
  );
};

// Entrada "degrau": sobe e aparece, com atraso em frames.
export const Sobe: React.FC<{ atraso?: number; distancia?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  atraso = 0,
  distancia = 70,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - atraso, fps, config: { damping: 200, mass: 0.6 } });
  return (
    <div style={{ ...style, opacity: p, transform: `translateY(${(1 - p) * distancia}px)` }}>{children}</div>
  );
};

// Fundo com brilho marinho suave que se move devagar.
export const Palco: React.FC<{ fundo: Fundo; children: React.ReactNode; lado?: 'a' | 'b' }> = ({ fundo, children, lado = 'a' }) => {
  const frame = useCurrentFrame();
  const t = TEMA[fundo];
  const deriva = interpolate(frame, [0, 300], [0, 60], { extrapolateRight: 'extend' });
  const circulo = (left: number, top: number): React.CSSProperties => ({
    position: 'absolute',
    left,
    top,
    width: 1100,
    height: 1100,
    borderRadius: '50%',
    background: t.brilho,
  });
  return (
    <div style={{ position: 'absolute', inset: 0, background: t.fundo, color: t.texto, fontFamily: FONTE_TEXTO, overflow: 'hidden' }}>
      <div style={circulo(lado === 'a' ? 420 - deriva : -500 + deriva, lado === 'a' ? 1200 - deriva : -380 + deriva)} />
      <div style={circulo(lado === 'a' ? -560 + deriva : 480 - deriva, lado === 'a' ? -420 + deriva : 1250 - deriva)} />
      {children}
    </div>
  );
};

export const Simbolo: React.FC<{ tamanho: number; cor: string }> = ({ tamanho, cor }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden>
    <rect x="5" y="18" width="11" height="24" rx="2" fill={cor} />
    <rect x="32" y="6" width="11" height="36" rx="2" fill={cor} />
    <rect x="14" y="25" width="20" height="9" fill={cor} />
  </svg>
);

export const Logo: React.FC<{ fonte: number; cor: string }> = ({ fonte, cor }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: fonte * 0.45, color: cor }}>
    <Simbolo tamanho={fonte * 1.6} cor={cor} />
    <span style={{ fontFamily: FONTE_TITULO, fontSize: fonte, letterSpacing: '-0.04em', lineHeight: 1 }}>
      <span style={{ fontWeight: 500 }}>Pedro</span> <span style={{ fontWeight: 700 }}>Hoffman</span>
    </span>
  </div>
);

export const Chapeu: React.FC<{ texto?: string; fundo: Fundo }> = ({ texto, fundo }) =>
  texto ? (
    <div style={{ fontSize: 28, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: TEMA[fundo].chapeu }}>
      {texto}
    </div>
  ) : null;
