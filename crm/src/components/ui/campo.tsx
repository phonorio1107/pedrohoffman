import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const base = 'h-10 w-full rounded-campo border border-[#8A8A92] bg-papel px-3 text-sm text-tinta placeholder:text-cinza';

export const Campo = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(base, className)} {...p} />
));
Campo.displayName = 'Campo';

export const Selecao = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(base, 'pr-8', className)} {...p} />
));
Selecao.displayName = 'Selecao';

export const Rotulo = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-cinza">
    {children}
  </label>
);
