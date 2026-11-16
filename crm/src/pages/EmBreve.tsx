import { Cartao } from '@/components/ui/cartao';

export function EmBreve({ titulo, fase }: { titulo: string; fase: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{titulo}</h1>
      <Cartao className="mt-6 p-6">
        <p className="font-titulo text-lg font-semibold">Chega na {fase}.</p>
        <p className="mt-1 text-sm text-grafite">Por enquanto, importe uma planilha e trabalhe a lista em Leads.</p>
      </Cartao>
    </div>
  );
}
