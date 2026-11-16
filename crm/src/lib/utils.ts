import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...v: ClassValue[]) => twMerge(clsx(v));

// Data sem horário ("2026-11-20") não pode passar por Date: o fuso mostraria um dia a menos.
export const dataBR = (iso: string | null) => {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.split('-').reverse().join('/');
  return new Date(iso).toLocaleDateString('pt-BR');
};
export const numeroBR = (n: number | null, casas = 0) =>
  n === null ? '' : n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
