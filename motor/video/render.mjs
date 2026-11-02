#!/usr/bin/env node
// Renderiza um Reels a partir de um video.json.
// Os arquivos de mídia (gravação de tela, narração, trilha) ficam na MESMA pasta do video.json.
//
// Uso (dentro de motor/):
//   npm run video -- ../conteudo/posts/<pasta>/video.json            -> reels.mp4
//   npm run video -- ../conteudo/posts/<pasta>/video.json --quadro 90 -> prévia.png (um quadro)
//   npm run video -- --vinheta                                        -> vinheta.mp4

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const arquivo = args.find((a) => a.endsWith('.json'));
const quadro = args.includes('--quadro') ? args[args.indexOf('--quadro') + 1] : null;
const vinheta = args.includes('--vinheta');

if (!arquivo && !vinheta) {
  console.error('Uso: npm run video -- caminho/do/video.json [--quadro N]   ou   npm run video -- --vinheta');
  process.exit(1);
}

// Navegador: usa REMOTION_CHROME se definido; senão o do Playwright instalado na máquina, se houver.
function navegador() {
  if (process.env.REMOTION_CHROME) return process.env.REMOTION_CHROME;
  const base = '/opt/pw-browsers';
  if (!existsSync(base)) return null;
  const pasta = readdirSync(base).find((d) => d.startsWith('chromium_headless_shell-'));
  if (!pasta) return null;
  const bin = path.join(base, pasta, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
  return existsSync(bin) ? bin : null;
}

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'index.ts');
const cmd = ['remotion'];
const extra = [];
const nav = navegador();
if (nav) extra.push(`--browser-executable=${nav}`);

if (vinheta) {
  cmd.push('render', raiz, 'Vinheta', path.resolve('saida', 'vinheta.mp4'));
} else {
  const pasta = path.dirname(path.resolve(arquivo));
  extra.push(`--props=${path.resolve(arquivo)}`, `--public-dir=${pasta}`);
  if (quadro) cmd.push('still', raiz, 'Reels', path.join(pasta, `previa-${quadro}.png`), `--frame=${quadro}`);
  else cmd.push('render', raiz, 'Reels', path.join(pasta, 'reels.mp4'), '--codec=h264', '--crf=18');
}

const r = spawnSync('npx', [...cmd, ...extra], { stdio: 'inherit' });
process.exit(r.status ?? 1);
