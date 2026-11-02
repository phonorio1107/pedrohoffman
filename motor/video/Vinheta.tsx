// Vinheta do símbolo Degrau: coluna curta, coluna alta, barra que liga, nome.
// Use no fim dos Reels ou sozinha (abertura de vídeo no YouTube/LinkedIn).
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONTE_TITULO, Fundo, Palco, TEMA } from './marca';

export const Vinheta: React.FC<{ fundo?: Fundo; frase?: string }> = ({ fundo = 'escuro', frase = 'Sua rotina, um degrau acima.' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cor = TEMA[fundo].texto;
  const mola = (atraso: number) => spring({ frame: frame - atraso, fps, config: { damping: 18, mass: 0.7 } });

  const curta = mola(2);
  const alta = mola(9);
  const barra = mola(17);
  const nome = mola(26);
  const fraseP = mola(36);
  const S = 360; // tamanho do símbolo

  return (
    <AbsoluteFill>
      <Palco fundo={fundo}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 64 }}>
          <svg width={S} height={S} viewBox="0 0 48 48" aria-hidden>
            {/* colunas crescem de baixo para cima; a barra entra da esquerda */}
            <rect x="5" y={42 - 24 * curta} width="11" height={24 * curta} rx="2" fill={cor} />
            <rect x="32" y={42 - 36 * alta} width="11" height={36 * alta} rx="2" fill={cor} />
            <rect x="14" y="25" width={20 * barra} height="9" fill={cor} />
          </svg>
          <div
            style={{
              fontFamily: FONTE_TITULO,
              fontSize: 96,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: cor,
              opacity: nome,
              transform: `translateY(${(1 - nome) * 30}px)`,
            }}
          >
            <span style={{ fontWeight: 500 }}>Pedro</span> <span style={{ fontWeight: 700 }}>Hoffman</span>
          </div>
          <div
            style={{
              fontSize: 40,
              color: TEMA[fundo].apoio,
              opacity: interpolate(fraseP, [0, 1], [0, 1]),
              marginTop: -24,
            }}
          >
            {frase}
          </div>
        </AbsoluteFill>
      </Palco>
    </AbsoluteFill>
  );
};
