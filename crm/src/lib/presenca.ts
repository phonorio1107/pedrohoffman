import type { Presenca } from './tipos';

/** Delivery: o "site" é a página da loja num app de entrega. */
const DELIVERY = ['ifood.com', 'rappi.com', 'aiqfome.com', '99food', 'ubereats.com'];

/** Plataformas de cardápio e links agregadores: a loja vende online, mas num sistema alugado. */
const PLATAFORMAS = [
  'cardapioweb.com',
  'menudino.com',
  'brendi.com',
  'letseat.com',
  'anota.ai',
  'goomer.app',
  'goomer.com',
  'saipos.com',
  'olaclick.com',
  'ola.click',
  'instadelivery.com',
  'neemo.com',
  'delivery.direct',
  'pedidon.web.app',
  'pedidon.com',
  'cardapio.ai',
  'cardapiodigital',
  'menu.app',
  'linktr.ee',
  'linktree',
  'bio.link',
  'beacons.ai',
  'wa.me',
  'whatsapp.com',
  'google.com',
  'business.site',
  'negocio.site',
];

export function dominio(url: string | null | undefined): string | null {
  if (!url) return null;
  const texto = url.trim();
  if (!texto) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

const contem = (host: string, lista: string[]) => lista.some((d) => host === d || host.endsWith(`.${d}`) || host.includes(d));

export function classificarPresenca(site: string | null | undefined): Presenca {
  const host = dominio(site);
  if (!host) return 'sem_site';
  if (/(^|\.)(instagram\.com|facebook\.com|fb\.com)$/.test(host)) return 'so_instagram';
  if (contem(host, DELIVERY)) return 'so_ifood';
  if (contem(host, PLATAFORMAS)) return 'plataforma';
  return 'site_proprio';
}
