import React from 'react';
import { Composition, continueRender, delayRender } from 'remotion';
import { fontesProntas } from './fontes';
import { FPS, Reels, RoteiroReels, duracaoTotal } from './Reels';
import { Vinheta } from './Vinheta';
import exemplo from './exemplo.json';

const espera = delayRender('Carregando fontes da marca');
fontesProntas.then(() => continueRender(espera));

export const Raiz: React.FC = () => (
  <>
    <Composition
      id="Reels"
      component={Reels}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={duracaoTotal(exemplo as RoteiroReels)}
      defaultProps={exemplo as RoteiroReels}
      calculateMetadata={({ props }) => ({ durationInFrames: duracaoTotal(props) })}
    />
    <Composition id="Vinheta" component={Vinheta} width={1080} height={1920} fps={FPS} durationInFrames={75} defaultProps={{ fundo: 'escuro' as const }} />
    <Composition id="VinhetaHorizontal" component={Vinheta} width={1920} height={1080} fps={FPS} durationInFrames={75} defaultProps={{ fundo: 'escuro' as const }} />
  </>
);
