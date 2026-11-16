import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variante = 'principal' | 'secundario' | 'fantasma';
const estilos: Record<Variante, string> = {
  // Marinho: só o botão principal, um por tela.
  principal: 'bg-marinho text-white hover:bg-[#13305a] disabled:bg-[#8A8A92]',
  secundario: 'border border-[#8A8A92] bg-papel text-tinta hover:bg-fundo',
  fantasma: 'text-grafite hover:bg-nevoa/60',
};

export const classeBotao = (variante: Variante = 'secundario', className?: string) =>
  cn(
    'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-campo px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
    estilos[variante],
    className,
  );

export const Botao = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }>(
  ({ variante = 'secundario', className, ...p }, ref) => (
    <button
      ref={ref}
      className={classeBotao(variante, className)}
      {...p}
    />
  ),
);
Botao.displayName = 'Botao';
