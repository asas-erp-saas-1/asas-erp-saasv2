'use client';
import { Suspense, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, ArrowRight } from 'lucide-react';

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
      <div className="text-center relative z-10">
          <h2 className="text-2xl font-bold mb-4 font-display uppercase tracking-widest text-asas-charcoal dark:text-asas-sand">Vérifiez votre Email</h2>
          <p className="text-asas-silver text-[10px] uppercase font-bold tracking-widest">Un lien de confirmation a été envoyé à <strong className="text-asas-charcoal dark:text-asas-sand">{email}</strong>. Cliquez sur ce lien pour activer votre compte.</p>
          <button onClick={() => router.push('/login')} className="mt-8 px-6 w-full py-4 bg-asas-navy text-asas-sand font-bold text-[10px] uppercase tracking-widest rounded-sm cursor-pointer shadow-sm">Retour à la connexion</button>
      </div>
    );
  }

  return (
    <>
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-sm bg-asas-navy border border-asas-silver/20 flex items-center justify-center shadow-sm">
            <Building2 className="w-6 h-6 text-asas-gold" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2 font-display uppercase tracking-widest text-asas-charcoal dark:text-asas-sand">ASAS OS</h2>
        <p className="text-asas-charcoal/80 dark:text-asas-silver text-center text-[10px] uppercase font-bold tracking-widest mb-8">Créer un compte</p>

        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-[10px] uppercase font-bold tracking-widest p-4 rounded-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-asas-silver tracking-widest uppercase mb-1.5">Nom Complet</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-asas-sand/50 dark:bg-black/10 border border-asas-silver/20 rounded-sm px-4 py-3 text-asas-charcoal dark:text-asas-sand focus:outline-none focus:border-asas-gold transition-all text-sm font-bold"
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-asas-silver tracking-widest uppercase mb-1.5">Email Professionnel</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-asas-sand/50 dark:bg-black/10 border border-asas-silver/20 rounded-sm px-4 py-3 text-asas-charcoal dark:text-asas-sand focus:outline-none focus:border-asas-gold transition-all text-sm font-bold"
              placeholder="jean@monagence.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-asas-silver tracking-widest uppercase mb-1.5">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-asas-sand/50 dark:bg-black/10 border border-asas-silver/20 rounded-sm px-4 py-3 text-asas-charcoal dark:text-asas-sand focus:outline-none focus:border-asas-gold transition-all text-sm font-bold"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-asas-navy border border-asas-silver/20 hover:bg-asas-charcoal dark:hover:bg-black text-asas-sand font-bold text-[10px] uppercase tracking-widest py-3.5 rounded-sm transition-all mt-4 disabled:opacity-50 relative group flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? 'Création...' : 'S\'inscrire'}
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />}
          </button>
        </form>
        <div className="mt-6 text-center text-[10px] uppercase font-bold tracking-widest text-asas-silver">
           Déjà un compte ? <button onClick={() => router.push('/login')} className="text-asas-navy dark:text-asas-sand hover:text-asas-gold ml-2 cursor-pointer">Se connecter</button>
        </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-white dark:bg-[#141618] text-asas-charcoal dark:text-asas-sand px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-asas-sand dark:from-black/10 to-transparent pointer-events-none z-0"></div>
      <div className="w-full max-w-md p-6 sm:p-8 border border-asas-silver/20 bg-white dark:bg-[#141618] rounded-sm shadow-sm z-10 relative">
        <Suspense fallback={<div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-asas-gold border-t-transparent rounded-full animate-spin"></div></div>}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
