'use client';
import { Suspense, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, ShieldCheck, ArrowRight, Github, Mail } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [factorId, setFactorId] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams?.get('invite');

  useEffect(() => {
    if (inviteCode) {
      localStorage.setItem('asa_invite_code', inviteCode);
    }
  }, [inviteCode]);

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
        await checkAgencyAndRedirect(supabase, data.user!.id);
      }
      setLoading(false);
      return;
    }

    await checkAgencyAndRedirect(supabase, data.user!.id);
  };

  const checkAgencyAndRedirect = async (supabase: any, userId: string) => {
    if (inviteCode) {
       router.push(`/invite/${inviteCode}`);
       return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', userId)
      .single();

    if (profile && !profile.agency_id) {
       router.push('/onboarding');
    } else {
       router.push('/dashboard/overview');
    }
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

    const { data: { user } } = await supabase.auth.getUser();
    await checkAgencyAndRedirect(supabase, user!.id);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <div className="w-10 h-10 rounded-lg bg-asas-navy flex items-center justify-center shadow-lg mb-6">
          <Building2 className="w-5 h-5 text-asas-gold" />
        </div>
        <h2 className="text-3xl font-display font-medium text-gray-900 dark:text-white mb-2 tracking-tight">
          {showMfa ? 'Vérification de sécurité' : 'Bon retour,'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {showMfa ? 'Veuillez confirmer votre identité.' : 'Connectez-vous à votre espace ASAS OS.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl mb-6 flex items-start gap-3">
           <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {!showMfa ? (
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adresse Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-asas-gold/50 focus:border-asas-gold transition-all"
              placeholder="nom@entreprise.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe</label>
              <a href="#" className="text-sm font-medium text-asas-gold hover:text-asas-navy dark:hover:text-white transition-colors">Oublié ?</a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-asas-gold/50 focus:border-asas-gold transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-asas-navy hover:bg-asas-charcoal text-white font-medium py-3 rounded-xl transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-[#0B0C0E] text-gray-500">Ou continuer avec</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button type="button" className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
             </button>
             <button type="button" className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium">
                <svg className="w-4 h-4" viewBox="0 0 21 21"><path d="M10 0H0v10h10V0zM21 0H11v10h10V0zM10 11H0v10h10V11zM21 11H11v10h10V11z" fill="#00a4ef"/></svg>
                Microsoft
             </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Nouveau sur ASAS OS ?{' '}
            <Link href="/signup" className="font-semibold text-asas-navy dark:text-white hover:text-asas-gold transition-colors">
              Créer un compte
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleMfaChallenge} className="flex flex-col gap-5">
          <div className="flex justify-center p-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
               <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">
            Ouvrez votre application d'authentification (Google Authenticator, Authy, etc.) et saisissez le code à 6 chiffres.
          </p>
          <div>
            <label className="block text-sm font-medium text-center text-gray-700 dark:text-gray-300 mb-2">Code d'authentification</label>
            <input
              type="text"
              required
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-asas-gold/50 focus:border-asas-gold transition-all font-mono text-center text-3xl tracking-[0.3em] font-medium"
              placeholder="000000"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || mfaCode.length !== 6}
            className="w-full bg-asas-navy hover:bg-asas-charcoal text-white font-medium py-3 rounded-xl transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? 'Vérification...' : 'Valider'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0B0C0E]">
      {/* Left side - Product showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#F8F9FA] dark:bg-[#141618] border-r border-gray-200 dark:border-white/5 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-asas-gold/10 blur-3xl"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-asas-navy/5 blur-3xl"></div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
           <Building2 className="w-6 h-6 text-asas-navy dark:text-white" />
           <span className="font-display font-bold text-lg tracking-tight text-asas-navy dark:text-white">ASAS OS</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-display font-medium text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6">
            L'excellence opérationnelle pour l'immobilier moderne.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
            Centralisez vos ventes, la gestion de votre équipe, vos leads et vos documents au sein de l'ERP conçu spécifiquement pour la promotion immobilière.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
             <div className="flex -space-x-2">
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#F8F9FA] dark:ring-[#141618]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt=""/>
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#F8F9FA] dark:ring-[#141618]" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt=""/>
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#F8F9FA] dark:ring-[#141618]" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64" alt=""/>
             </div>
             <p>Rejoint par +500 professionnels</p>
          </div>
        </div>

        <div className="relative z-10 text-sm font-medium text-gray-500">
          © {new Date().getFullYear()} ASAS Immobilier.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <Suspense fallback={<div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-asas-gold border-t-transparent rounded-full animate-spin"></div></div>}>
           <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
