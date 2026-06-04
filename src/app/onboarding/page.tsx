'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Building2, Rocket, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function OnboardingPage() {
  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  
  const router = useRouter();

  const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
    return { supabase: createBrowserClient(supabaseUrl, supabaseKey), isMock: supabaseUrl === 'https://placeholder.supabase.co' };
  };

  useEffect(() => {
    const checkStatus = async () => {
      // Check for pending invite
      const pendingInvite = localStorage.getItem('asa_invite_code');
      if (pendingInvite) {
        // Clear it so we don't infinitely loop if it's invalid
        localStorage.removeItem('asa_invite_code');
        router.push(`/invite/${pendingInvite}`);
        return;
      }

      const { supabase, isMock } = getSupabase();
      if (isMock) {
        setChecking(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user already has an agency
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single();
        
      if (profile?.agency_id) {
         router.push('/dashboard/overview');
      } else {
         setChecking(false);
      }
    };
    
    checkStatus();
  }, [router]);

  const handleOnboarding = async (e: React.FormEvent) => {
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // We should call a secure RPC to create the agency and link the profile
      const { data, error: rpcError } = await supabase.rpc('create_agency_and_link_owner', {
        _agency_name: agencyName,
        _agency_phone: phone,
        _user_id: user.id
      });

      if (rpcError) {
        // Fallback: doing it directly if RPC doesn't exist yet (though it should be protected by RLS)
        // Actually, let's just do it directly with the service role key internally, or an RPC. 
        // We will do a direct insert, assuming RLS allows insertion into agencies for authenticated users.
        const { data: newAgency, error: createError } = await supabase
          .from('agencies')
          .insert({ name: agencyName, phone: phone })
          .select('id')
          .single();
          
        if (createError) throw new Error("Impossible de créer l'agence. " + createError.message);
        
        const { error: linkError } = await supabase
          .from('profiles')
          .update({ agency_id: newAgency.id, role: 'owner' })
          .eq('id', user.id);
          
        if (linkError) throw new Error("Impossible de lier votre profil.");
      }

      // Force session refresh for RLS policies checking profiles.agency_id
      await supabase.auth.refreshSession();
      router.push('/dashboard/overview');
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (checking) {
     return (
       <div className="min-h-screen bg-white dark:bg-[#0B0C0E] flex flex-col items-center justify-center relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-asas-navy/10 dark:bg-asas-gold/5 rounded-full blur-[120px] pointer-events-none"></div>
         <div className="flex flex-col items-center gap-6 z-10">
           <div className="w-12 h-12 border-4 border-asas-navy/20 dark:border-white/10 border-t-asas-navy dark:border-t-white rounded-full animate-spin"></div>
           <p className="text-gray-500 font-medium tracking-tight">Préparation de votre espace...</p>
         </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0B0C0E] py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-asas-navy/5 dark:bg-asas-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="w-full max-w-xl bg-white dark:bg-[#141618] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 p-8 sm:p-12 z-10 relative"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 dark:border-blue-800/30">
            <Rocket className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-display font-medium text-gray-900 dark:text-white mb-3 tracking-tight">Configuration du Workspace</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
            Vous êtes la première personne de cette agence. Créez votre espace de travail centralisé en quelques secondes.
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl flex items-start gap-3 overflow-hidden"
            >
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span className="font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleOnboarding} className="flex flex-col gap-6">
          <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5 space-y-5">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de l'Agence ou Promotion</label>
               <input
                 type="text"
                 required
                 value={agencyName}
                 onChange={(e) => setAgencyName(e.target.value)}
                 className="w-full bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-asas-gold/50 focus:border-asas-gold transition-all"
                 placeholder="Ex: ASAS Immobilier"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone Principal (Optionnel)</label>
               <input
                 type="tel"
                 value={phone}
                 onChange={(e) => setPhone(e.target.value)}
                 className="w-full bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-asas-gold/50 focus:border-asas-gold transition-all"
                 placeholder="+213 550 00 00 00"
               />
             </div>
          </div>

          <div className="flex items-start gap-3 mt-2 text-sm text-gray-500">
             <ShieldCheck className="w-5 h-5 shrink-0 text-gray-400" />
             <p>Vos données sont isolées et sécurisées. Seules les personnes que vous inviterez auront accès à ce workspace.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-asas-navy hover:bg-asas-charcoal text-white font-medium py-3.5 rounded-xl transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? 'Création de l\'espace...' : 'Terminer l\'installation'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
