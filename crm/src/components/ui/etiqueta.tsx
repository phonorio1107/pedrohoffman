import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type Tom = 'neutro' | 'marinho' | 'sucesso' | 'atencao' | 'erro' | 'escuro';
const tons: Record<Tom, string> = {
  neutro: 'bg-fundo text-grafite border-nevoa',
  marinho: 'bg-marinho-claro text-marinho border-transparent',
  sucesso: 'bg-sucesso-fundo text-sucesso border-transparent',
  atencao: 'bg-atencao-fundo text-atencao border-transparent',
  erro: 'bg-erro-fundo text-erro border-transparent',
  escuro: 'bg-tinta text-white border-transparent',
};

export const Etiqueta = ({ tom = 'neutro', className, ...p }: HTMLAttributes<HTMLSpanElement> & { tom?: Tom }) => (
  <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium', tons[tom], className)} {...p} />
);
