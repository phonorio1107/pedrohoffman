import { CalendarCheck, FileUp, LogOut, MessageSquareText, Users, Wallet } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Logo } from './Simbolo';

const PROSPECCAO = [
  { para: '/hoje', rotulo: 'Hoje', icone: CalendarCheck, emBreve: true },
  { para: '/leads', rotulo: 'Leads', icone: Users },
  { para: '/importar', rotulo: 'Importar planilha', icone: FileUp },
  { para: '/modelos', rotulo: 'Modelos de mensagem', icone: MessageSquareText, emBreve: true },
];
const CLIENTES = [{ para: '/carteira', rotulo: 'Carteira', icone: Wallet, emBreve: true }];
const ABAS = [PROSPECCAO[0], PROSPECCAO[1], PROSPECCAO[2], CLIENTES[0]];

function Item({ para, rotulo, icone: Icone, emBreve }: (typeof PROSPECCAO)[number]) {
  return (
    <NavLink
      to={para}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-campo px-3 py-2 text-sm text-[#C3C3CA] hover:bg-white/5 hover:text-white',
          isActive && 'bg-white/10 font-semibold text-white',
        )
      }
    >
      <Icone size={18} strokeWidth={2} aria-hidden="true" />
      <span className="flex-1">{rotulo}</span>
      {emBreve && <span className="text-[10px] uppercase tracking-[0.1em] text-[#8A8A92]">Em breve</span>}
    </NavLink>
  );
}

export function Layout({ usuario, demo, onSair }: { usuario: string; demo: boolean; onSair: () => void }) {
  return (
    <div className="min-h-dvh md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-tinta px-4 py-6 md:sticky md:top-0 md:flex md:h-dvh">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Principal">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A8A92]">Prospecção</p>
          {PROSPECCAO.map((i) => (
            <Item key={i.para} {...i} />
          ))}
          <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A8A92]">Clientes</p>
          {CLIENTES.map((i) => (
            <Item key={i.para} {...i} />
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 px-2 pt-4 text-sm">
          {demo && <p className="mb-2 rounded-md bg-white/10 px-2 py-1 text-xs text-white">Modo demonstração: os dados ficam só neste navegador.</p>}
          <p className="truncate text-[#C3C3CA]">{usuario}</p>
          {!demo && (
            <button onClick={onSair} className="mt-2 inline-flex items-center gap-2 text-[#C3C3CA] hover:text-white">
              <LogOut size={16} aria-hidden="true" /> Sair
            </button>
          )}
        </div>
      </aside>

      <header className="flex items-center justify-between bg-tinta px-4 py-3 md:hidden">
        <Logo />
        {demo && <span className="text-xs text-[#C3C3CA]">Demonstração</span>}
      </header>

      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-nevoa bg-papel md:hidden" aria-label="Abas">
        {ABAS.map(({ para, rotulo, icone: Icone }) => (
          <NavLink
            key={para}
            to={para}
            className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2 text-[11px] text-cinza', isActive && 'font-semibold text-tinta')}
          >
            <Icone size={20} aria-hidden="true" />
            {rotulo === 'Importar planilha' ? 'Importar' : rotulo}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
