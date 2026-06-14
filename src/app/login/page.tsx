'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch {
      toast.error('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch {
      toast.error('Erro ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('E-mail de redefinição enviado!');
      setMode('login');
    } catch {
      toast.error('E-mail não encontrado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">ContentAI</h1>
          <p className="text-sm text-gray-500">Central de Conteúdo com IA</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {mode === 'login' ? (
            <>
              <h2 className="mb-5 text-center text-base font-semibold">Entrar na plataforma</h2>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.826.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continuar com Google
              </button>

              <div className="mb-4 flex items-center gap-3">
                <div className="flex-1 border-t border-gray-100" />
                <span className="text-xs text-gray-400">ou</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-9 text-sm focus:border-brand-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:opacity-50"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <button
                onClick={() => setMode('reset')}
                className="mt-3 w-full text-center text-xs text-gray-400 hover:text-brand-600"
              >
                Esqueci minha senha
              </button>
            </>
          ) : (
            <>
              <h2 className="mb-2 text-center text-base font-semibold">Redefinir senha</h2>
              <p className="mb-5 text-center text-xs text-gray-500">
                Digite seu e-mail e enviaremos um link de redefinição.
              </p>
              <form onSubmit={handleReset} className="space-y-3">
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>
              <button
                onClick={() => setMode('login')}
                className="mt-3 w-full text-center text-xs text-gray-400 hover:text-brand-600"
              >
                Voltar ao login
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Novo aqui? Fale com o administrador para criar sua conta.
        </p>
      </div>
    </div>
  );
}
