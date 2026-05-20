'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Handshake, AlertCircle, RefreshCcw, Save } from 'lucide-react';
import { ErrorTracker } from '@/lib/observability/errors';

function DealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId') || '';

  const [formData, setFormData] = useState({
    title: '',
    value: '',
    leadId: leadId,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!formData.title || !formData.value) {
        throw new Error("Veuillez remplir tous les champs obligatoires.");
      }

      if (isNaN(Number(formData.value)) || Number(formData.value) <= 0) {
         throw new Error("Valeur du contrat invalide.");
      }

      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          value: Number(formData.value),
          leadId: formData.leadId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la création de la transaction.");
      }

      router.push('/dashboard/deals');
    } catch (err: any) {
      setError(err.message);
      ErrorTracker.captureError(err, { context: 'DealCreationForm' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-4 sm:mt-8 bg-white dark:bg-[#141618] border border-asas-silver/20 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
          <Handshake className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight font-display">Nouvelle Transaction</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Création de deal</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3 font-semibold text-sm relative">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Titre de la transaction</label>
          <input
            type="text"
            className="w-full bg-[#111] border border-black/10 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
            placeholder="ex: Appartement T4 Atlas"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Valeur Estimée (DZD)</label>
          <input
            type="number"
            className="w-full bg-[#111] border border-black/10 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
            placeholder="ex: 15000000"
            value={formData.value}
            onChange={e => setFormData({ ...formData, value: e.target.value })}
            autoComplete="off"
          />
        </div>
        {leadId && (
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Lien Entité (Lead ID)</label>
            <input
              type="text"
              readOnly
              className="w-full bg-white dark:bg-[#141618] text-gray-600 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 font-mono text-sm cursor-not-allowed"
              value={leadId}
            />
          </div>
        )}

        <div className="flex gap-4 pt-6 border-t border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-transparent border border-black/10 dark:border-white/10 hover:border-black/20 dark:border-white/20 text-gray-900 dark:text-white rounded-xl font-bold transition-all text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] flex justify-center items-center gap-2 px-6 py-3 bg-white hover:bg-gray-200 text-black rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] text-sm"
          >
            {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Enregistrer</>}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewDealPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-32"><RefreshCcw className="w-8 h-8 animate-spin text-gray-600" /></div>}>
      <DealForm />
    </Suspense>
  )
}
