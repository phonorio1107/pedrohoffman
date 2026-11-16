import { useState, type FormEvent } from 'react';
import { Logo } from '@/components/Simbolo';
import { Botao } from '@/components/ui/botao';
import { Campo, Rotulo } from '@/components/ui/campo';
import { repo } from '@/lib/dados';

export function Login({ onEntrar }: { onEntrar: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await repo.entrar(email, senha);
      onEntrar(email);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-tinta px-4">
      <form onSubmit={enviar} className="w-full max-w-sm rounded-cartao bg-papel p-8">
        <div className="mb-8 flex justify-center">
          <Logo cor="#0E0E10" />
        </div>
        <h1 className="text-2xl font-bold">Entrar no CRM</h1>
        <div className="mt-6 space-y-4">
          <div>
            <Rotulo htmlFor="email">E-mail</Rotulo>
            <Campo id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Rotulo htmlFor="senha">Senha</Rotulo>
            <Campo id="senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          {erro && <p className="rounded-md bg-erro-fundo px-3 py-2 text-sm text-erro">{erro}</p>}
          <Botao variante="principal" className="w-full" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Botao>
        </div>
      </form>
    </div>
  );
}
