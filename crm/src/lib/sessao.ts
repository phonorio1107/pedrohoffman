/** A ordem da fila de hoje, para a ficha saber qual é o próximo lead. Some ao fechar a aba. */
const CHAVE = 'crm-fila-hoje';

export function guardarFila(ids: string[]) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(ids));
  } catch {
    /* sem armazenamento: a ficha só não mostra "próximo" */
  }
}

export function proximoDaFila(atual: string): string | null {
  try {
    const ids = JSON.parse(sessionStorage.getItem(CHAVE) ?? '[]') as string[];
    const i = ids.indexOf(atual);
    return i >= 0 && i + 1 < ids.length ? ids[i + 1] : null;
  } catch {
    return null;
  }
}

export function estaNaFila(atual: string): boolean {
  try {
    return (JSON.parse(sessionStorage.getItem(CHAVE) ?? '[]') as string[]).includes(atual);
  } catch {
    return false;
  }
}

const CHAVE_META = 'crm-meta-diaria';
export function lerMeta(padrao: number): number {
  try {
    const n = Number(localStorage.getItem(CHAVE_META));
    return n >= 1 && n <= 100 ? n : padrao;
  } catch {
    return padrao;
  }
}
export function gravarMeta(n: number) {
  try {
    localStorage.setItem(CHAVE_META, String(n));
  } catch {
    /* vale só nesta visita */
  }
}
