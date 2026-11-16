/** Deixa só dígitos no formato 55 + DDD + número. Devolve null se não parecer um telefone brasileiro. */
export function normalizarTelefone(bruto: string | number | null | undefined): string | null {
  if (bruto === null || bruto === undefined) return null;
  // Algumas planilhas trazem vários números separados por vírgula: fica o primeiro.
  const primeiro = String(bruto).split(/[,;/|]/)[0];
  let d = primeiro.replace(/\D/g, '');
  if (!d) return null;
  d = d.replace(/^0+/, '');
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (!d.startsWith('55') || (d.length !== 12 && d.length !== 13)) return null;
  return d;
}

/** Celular brasileiro: 55 + DDD + 9 + 8 dígitos. É o que normalmente tem WhatsApp. */
export function ehCelular(normalizado: string | null): boolean {
  return !!normalizado && normalizado.length === 13 && normalizado[4] === '9';
}

/** (11) 98765-4321 ou (11) 4817-9317 */
export function formatarTelefone(normalizado: string | null): string {
  if (!normalizado) return '';
  const ddd = normalizado.slice(2, 4);
  const n = normalizado.slice(4);
  return n.length === 9 ? `(${ddd}) ${n.slice(0, 5)}-${n.slice(5)}` : `(${ddd}) ${n.slice(0, 4)}-${n.slice(4)}`;
}

export function linkWhatsApp(normalizado: string, mensagem = ''): string {
  return `https://wa.me/${normalizado}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`;
}
