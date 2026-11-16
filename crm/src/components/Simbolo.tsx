/** Símbolo Degrau (grade de 48). Nunca igualar colunas, espelhar ou esticar. */
export const Simbolo = ({ tamanho = 24, cor = 'currentColor' }: { tamanho?: number; cor?: string }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true">
    <rect x="5" y="18" width="11" height="24" rx="2" fill={cor} />
    <rect x="32" y="6" width="11" height="36" rx="2" fill={cor} />
    <rect x="14" y="25" width="20" height="9" fill={cor} />
  </svg>
);

export const Logo = ({ cor = '#FFFFFF' }: { cor?: string }) => (
  <span className="inline-flex items-center gap-2 font-titulo text-lg tracking-[-0.04em]" style={{ color: cor }}>
    <Simbolo tamanho={26} cor={cor} />
    <span>
      <span className="font-medium">Pedro</span> <span className="font-bold">Hoffman</span>
    </span>
  </span>
);
