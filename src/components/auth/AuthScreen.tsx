import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Sparkles, CheckCircle2, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInGuest } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }
    if (!password || password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao autenticar. Tente novamente ou use o Acesso Direto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickGuest = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInGuest();
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível entrar sem conta neste momento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 selection:bg-emerald-100">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#4A0E2E] text-white flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
            💄
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Consultoria de Beleza
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            O Boticário & Eudora • Sincronização e Backup Seguro em Nuvem
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-950">
          <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Lembrar de Mim Ativo:</strong> Você só precisa entrar uma única vez. O aplicativo lembrará deste aparelho e sincronizará tudo automaticamente.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: consultora@gmail.com"
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 focus:outline-hidden text-sm bg-slate-50/50 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Senha
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 focus:outline-hidden text-sm bg-slate-50/50 focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {submitting ? (
              <span className="inline-block animate-pulse">Conectando...</span>
            ) : isRegister ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Criar Conta e Entrar
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Entrar e Sincronizar
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="pt-2 text-center border-t border-slate-100 flex flex-col gap-2.5 text-xs text-slate-600">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-emerald-900 font-bold hover:underline cursor-pointer"
          >
            {isRegister ? 'Já tem conta? Clique para Fazer Login' : 'Primeira vez? Clique para Criar Conta'}
          </button>

          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Ou</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleQuickGuest}
            disabled={submitting}
            className="w-full py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs border border-slate-200"
          >
            <UserCheck className="w-4 h-4 text-emerald-800" />
            Entrar Direto (Acesso Rápido)
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
          </button>
        </div>
      </div>
    </div>
  );
};
