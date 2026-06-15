import { useState } from 'react';
import type { AuthSession } from '../services/supabaseRest';
import { signIn, signUp } from '../services/supabaseRest';

interface AuthProps {
  onSuccess: (session: AuthSession) => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    try {
      const session = mode === 'login' ? await signIn(email, password) : await signUp(email, password);
      if (session) return onSuccess(session);
      setMessage('Проверьте почту и подтвердите регистрацию, затем войдите.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка авторизации');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="card p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Supabase Auth</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Вход в Бух2</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">При наличии ENV приложение работает с Supabase и RLS.</p>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button type="button" className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === 'login' ? 'bg-white shadow' : 'text-slate-600'}`} onClick={() => setMode('login')}>Вход</button>
            <button type="button" className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === 'signup' ? 'bg-white shadow' : 'text-slate-600'}`} onClick={() => setMode('signup')}>Регистрация</button>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label><span className="label">Email</span><input className="input" type="email" name="email" autoComplete="email" required /></label>
            <label><span className="label">Пароль</span><input className="input" type="password" name="password" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>
            <button className="btn-primary w-full" disabled={isLoading} type="submit">{isLoading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
          </form>
          {message ? <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{message}</div> : null}
        </div>
      </div>
    </div>
  );
}
