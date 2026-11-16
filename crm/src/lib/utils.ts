import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...v: ClassValue[]) => twMerge(clsx(v));

export const dataBR = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '');
export const numeroBR = (n: number | null, casas = 0) =>
  n === null ? '' : n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
