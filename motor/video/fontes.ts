// Inter Tight (títulos) e Inter (texto), carregadas dos arquivos locais.
import { loadFont } from '@remotion/fonts';
import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff2';
import inter500 from '@fontsource/inter/files/inter-latin-500-normal.woff2';
import inter600 from '@fontsource/inter/files/inter-latin-600-normal.woff2';
import tight500 from '@fontsource/inter-tight/files/inter-tight-latin-500-normal.woff2';
import tight600 from '@fontsource/inter-tight/files/inter-tight-latin-600-normal.woff2';
import tight700 from '@fontsource/inter-tight/files/inter-tight-latin-700-normal.woff2';

const lista: [string, string, string][] = [
  ['Inter', inter400, '400'],
  ['Inter', inter500, '500'],
  ['Inter', inter600, '600'],
  ['Inter Tight', tight500, '500'],
  ['Inter Tight', tight600, '600'],
  ['Inter Tight', tight700, '700'],
];

export const fontesProntas = Promise.all(
  lista.map(([family, url, weight]) => loadFont({ family, url, weight })),
);
