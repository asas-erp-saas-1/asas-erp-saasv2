'use client';
import { Suspense, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { supabase, isMock } = getSupabase();

    if (isMock) {
      setTimeout(() => {
        setSuccess(true);
      }, 1000);
      return;
    }

    // Register user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user && authData.session) {
      if (inviteCode) {
        router.push(`/invite/${inviteCode}`);
      } else {
        router.push('/onboarding');
      }
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center relative z-10">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
             </svg>
          </div>
          <h2 className="text-3xl font-display font-medium text-gray-900 dark:text-white mb-4 tracking-tight">Vérifiez votre Email</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
            Un lien de confirmation a été envoyé à <strong className="text-gray-900 dark:text-white">{email}</strong>. Cliquez sur ce lien pour activer votre compte. Vous pouvez fermer cette page.
          </p>
          <button onClick={() => router.push('/login')} className="w-full py-3 bg-asas-navy hover:bg-asas-charcoal text-white font-medium rounded-xl transition-all">
            Retour à la connexion
          </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-lg bg-asas-navy flex items-center justify-center shadow-lg mb-6">
            <Building2 className="w-5 h-5 text-asas-gold" />
          </div>
          <h2 className="text-3xl font-display font-medium text-gray-900 dark:text-white mb-2 tracking-tight">
            Créer un compte
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Démarrez avec ASAS OS.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl mb-6 flex items-start gap-3">
             <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom Complet</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-asas-gold/50 focus:border-asas-gold transition-all"
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Professionnel</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-asas-gold/50 focus:border-asas-gold transition-all"
              placeholder="jean@monagence.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe</label>
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
            {loading ? 'Création en cours...' : 'S\'inscrire'}
          </button>
          
          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-semibold text-asas-navy dark:text-white hover:text-asas-gold transition-colors">
              Se connecter
            </Link>
          </p>
        </form>
    </div>
  );
}

export default function SignupPage() {
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
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
