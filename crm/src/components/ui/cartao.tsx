import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Cartao = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-cartao border border-nevoa bg-papel', className)} {...p} />
);
