import { normalizarNome } from './colunas';
import { dominio } from './presenca';

/** Marcas que são rede ou franquia: quem decide fica na matriz, não na loja. */
const MARCAS = [
  'madero',
  'jeronimo',
  'giraffas',
  'cabana burger',
  'bobs',
  'mcdonald',
  'burger king',
  'subway',
  'habib',
  'outback',
  'dominos',
  'pizza hut',
  'spoleto',
  'china in box',
  'ragazzo',
  'coco bambu',
  'kfc',
  'popeyes',
  'ponto chic',
  'the fifties',
  'johnny rockets',
  'jack in the box',
  'patroni',
  'casa do pao de queijo',
  'vivenda do camarao',
  'montana grill',
  'divino fogao',
  'pizzaria 1900',
  'cacau show',
];

const limpar = (s: string) => normalizarNome(s).replace(/[._]+/g, ' ').trim();

export function ehMarcaConhecida(nome: string): boolean {
  const n = ` ${limpar(nome)} `;
  return MARCAS.some((m) => n.includes(` ${m} `) || n.includes(` ${m}s `));
}

interface ItemRede {
  nome: string;
  site: string | null;
  place_id: string | null;
  endereco: string | null;
  rede: boolean;
}

/**
 * Marca como rede: marca conhecida, coluna "rede" da planilha, ou o mesmo nome
 * ou o mesmo site próprio em dois ou mais endereços diferentes do arquivo.
 */
export function marcarRedes<T extends ItemRede>(itens: T[], ehSiteProprio: (site: string | null) => boolean): T[] {
  const lugaresPorNome = new Map<string, Set<string>>();
  const lugaresPorSite = new Map<string, Set<string>>();
  const lugar = (i: ItemRede) => i.place_id ?? i.endereco ?? i.nome;

  for (const i of itens) {
    const n = limpar(i.nome);
    if (!lugaresPorNome.has(n)) lugaresPorNome.set(n, new Set());
    lugaresPorNome.get(n)!.add(lugar(i));
    const d = ehSiteProprio(i.site) ? dominio(i.site) : null;
    if (d) {
      if (!lugaresPorSite.has(d)) lugaresPorSite.set(d, new Set());
      lugaresPorSite.get(d)!.add(lugar(i));
    }
  }

  return itens.map((i) => {
    const d = ehSiteProprio(i.site) ? dominio(i.site) : null;
    const repetido = (lugaresPorNome.get(limpar(i.nome))?.size ?? 0) > 1 || (d ? (lugaresPorSite.get(d)?.size ?? 0) > 1 : false);
    return { ...i, rede: i.rede || ehMarcaConhecida(i.nome) || repetido };
  });
}
