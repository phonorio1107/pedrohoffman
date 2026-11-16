import { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';

// A página publicada no claude.ai só aceita rotas no hash (#/leads).
const Roteador = import.meta.env.VITE_ARTIFACT ? HashRouter : BrowserRouter;
import { Layout } from './components/Layout';
import { repo } from './lib/dados';
import { EmBreve } from './pages/EmBreve';
import { Ficha } from './pages/Ficha';
import { Hoje } from './pages/Hoje';
import { Importar } from './pages/Importar';
import { Leads } from './pages/Leads';
import { Login } from './pages/Login';
import { Modelos } from './pages/Modelos';

export default function App() {
  const [usuario, setUsuario] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    repo.usuario().then(setUsuario).catch(() => setUsuario(null));
  }, []);

  if (usuario === undefined) return null;
  if (!usuario) return <Login onEntrar={setUsuario} />;

  const sair = async () => {
    await repo.sair();
    setUsuario(null);
  };

  return (
    <Roteador>
      <Routes>
        <Route element={<Layout usuario={usuario} demo={repo.modo === 'demo'} onSair={sair} />}>
          <Route path="/" element={<Navigate to="/hoje" replace />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<Ficha />} />
          <Route path="/importar" element={<Importar />} />
          <Route path="/hoje" element={<Hoje />} />
          <Route path="/modelos" element={<Modelos />} />
          <Route path="/carteira" element={<EmBreve titulo="Carteira" fase="Fase 3" />} />
          <Route path="*" element={<Navigate to="/hoje" replace />} />
        </Route>
      </Routes>
    </Roteador>
  );
}
