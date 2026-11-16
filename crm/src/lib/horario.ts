const DIAS: Record<string, { ordem: number; curto: string }> = {
  monday: { ordem: 1, curto: 'Seg' },
  tuesday: { ordem: 2, curto: 'Ter' },
  wednesday: { ordem: 3, curto: 'Qua' },
  thursday: { ordem: 4, curto: 'Qui' },
  friday: { ordem: 5, curto: 'Sex' },
  saturday: { ordem: 6, curto: 'Sáb' },
  sunday: { ordem: 7, curto: 'Dom' },
};

interface Hora {
  h: number;
  m: number;
  sufixo: 'AM' | 'PM' | null;
}

function lerHora(t: string): Hora | null {
  const r = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!r) return null;
  return { h: Number(r[1]), m: Number(r[2] ?? 0), sufixo: (r[3]?.toUpperCase() as 'AM' | 'PM' | undefined) ?? null };
}

const para24 = (h: Hora, sufixo: 'AM' | 'PM') => (h.h % 12) + (sufixo === 'PM' ? 12 : 0) + h.m / 60;
const rotuloHora = (x: number) => {
  const h = Math.floor(x) % 24;
  const m = Math.round((x - Math.floor(x)) * 60);
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};

/**
 * Converte o horário do Outscraper ("Sunday,6,10:30PM|Monday,11AM,2:15PM|...") em
 * "Seg 11h–14h15 e 18h–22h30 · Dom 18h–22h30". Se não entender o formato, devolve null.
 */
export function formatarHorario(csv: string | null): string | null {
  if (!csv) return null;
  const porDia = new Map<string, { ordem: number; faixas: string[] }>();
  for (const bloco of csv.split('|')) {
    const [dia, ...resto] = bloco.split(',');
    const info = DIAS[dia?.trim().toLowerCase()];
    if (!info) return null;
    const dado = porDia.get(info.curto) ?? { ordem: info.ordem, faixas: [] };
    const texto = resto.join(',').trim().toLowerCase();
    if (/^closed$|^fechado$/.test(texto)) dado.faixas.push('fechado');
    else if (/^open 24 hours$/.test(texto)) dado.faixas.push('24 horas');
    else {
      const [a, b] = resto.map((x) => lerHora(x));
      if (!a || !b) return null;
      const fim = b.sufixo ?? 'PM';
      let ini = para24(a, a.sufixo ?? fim);
      const f = para24(b, fim);
      if (!a.sufixo && ini > f) ini = para24(a, 'AM');
      dado.faixas.push(`${rotuloHora(ini)}–${rotuloHora(f)}`);
    }
    porDia.set(info.curto, dado);
  }
  if (!porDia.size) return null;
  return [...porDia.entries()]
    .sort((x, y) => x[1].ordem - y[1].ordem)
    .map(([dia, d]) => `${dia} ${d.faixas.join(' e ')}`)
    .join(' · ');
}
