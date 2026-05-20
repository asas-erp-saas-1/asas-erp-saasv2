'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Building2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [factorId, setFactorId] = useState('');

  const router = useRouter();

  const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
    return { supabase: createBrowserClient(supabaseUrl, supabaseKey), isMock: supabaseUrl === 'https://placeholder.supabase.co' };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { supabase, isMock } = getSupabase();

    if (isMock) {
      setTimeout(() => {
        router.push('/dashboard/overview');
      }, 1000);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Check MFA
    const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (mfaError) {
      setError(mfaError.message);
      setLoading(false);
      return;
    }

    if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
      // User has MFA enabled, find a TOTP factor
      const factors = await supabase.auth.mfa.listFactors();
      const totpFactor = factors.data?.totp?.[0];
      if (totpFactor) {
        setFactorId(totpFactor.id);
        setShowMfa(true);
      } else {
        // Enrolled but no valid factor? (shouldn't happen)
        router.push('/dashboard/overview');
      }
      setLoading(false);
      return;
    }

    router.push('/dashboard/overview');
  };

  const handleMfaChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { supabase } = getSupabase();

    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setError(challenge.error.message);
      setLoading(false);
      return;
    }

    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: mfaCode,
    });

    if (verify.error) {
      setError(verify.error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard/overview');
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-white dark:bg-[#141618] text-gray-900 dark:text-white px-4 py-12 bg-dot-grid relative">
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-white dark:from-[#141618] to-transparent pointer-events-none z-0"></div>
      <div className="w-full max-w-md p-6 sm:p-8 border border-gray-200 dark:border-white/5 bg-white dark:bg-[#0A0A0A] rounded-3xl shadow-2xl z-10 relative">
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-blue-600 to-indigo-900 border border-blue-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2 font-display tracking-tight text-gray-900 dark:text-white">ASAS OS</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-8">{showMfa ? 'Vérification en deux étapes' : 'Connectez-vous à votre compte'}</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-4 rounded-xl mb-6 font-medium">
            {error}
          </div>
        )}

        {!showMfa ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#141618] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                placeholder="admin@asas.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all mt-4 disabled:opacity-50 relative overflow-hidden group flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? 'Connexion en cours...' : 'Connexion'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaChallenge} className="flex flex-col gap-4">
            <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl mb-2">
              <ShieldCheck className="w-8 h-8 text-blue-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">
              Ouvrez votre application d'authentification (Google Authenticator, Authy) et saisissez le code à 6 chiffres.
            </p>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide text-center">Code d'authentification</label>
              <input
                type="text"
                required
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-center text-2xl tracking-[0.5em] font-bold"
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? 'Vérification...' : 'Valider le code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
