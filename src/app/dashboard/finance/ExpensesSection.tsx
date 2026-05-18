'use client'
import { useState, useEffect } from 'react'
import { PlusCircle, TrendingUp, TrendingDown, Receipt, DollarSign, Activity } from 'lucide-react'
import { clsx } from 'clsx'

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-DZ').format(Math.round(n)) + ' DZD'
}

export function ExpensesSection() {
  const [pnl, setPnl] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/ledger?view=pnl').then(r => r.json()),
      fetch('/api/ledger?view=expenses').then(r => r.json())
    ]).then(([p, e]) => {
      setPnl(p)
      setExpenses(e.expenses || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const amount = Number(form.get('amount'))
    const category = form.get('category')
    const description = form.get('description')
    
    if (!amount || !category || !description) return

    await fetch('/api/command-gateway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commandId: crypto.randomUUID(),
        aggregateId: crypto.randomUUID(),
        type: 'LOG_EXPENSE',
        expectedVersion: 1,
        payload: { amount, category, description }
      })
    })

    setShowModal(false)
    loadData()
  }

  if (loading || !pnl) return <div className="animate-pulse h-64 bg-gray-100 rounded-3xl mt-8" />

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">Compte de Résultat (P&L)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 dark:bg-[#050505] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-xl">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Chiffre d'Affaires</p>
          <p className="text-3xl font-black text-emerald-500">{fmt(pnl.revenue)}</p>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">Marge Brute: {Math.round(pnl.grossMargin)}%</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#050505] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-xl">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Dépenses (COGS + Charges)</p>
          <p className="text-3xl font-black text-red-500">{fmt(pnl.cogs + pnl.expenses)}</p>
          <p className="text-xs font-bold text-gray-500 mt-2">Commissions: {fmt(pnl.cogs)}</p>
        </div>
        <div className="bg-[#050A05] p-6 rounded-3xl border border-emerald-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest mb-1 relative z-10">Résultat Net</p>
          <p className="text-3xl font-black text-emerald-400 relative z-10">{fmt(pnl.netIncome)}</p>
          <p className="text-xs font-bold text-emerald-600 mt-2 relative z-10">Marge Nette: {Math.round(pnl.netMargin)}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
         <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-500" /> Registre des Charges
         </h3>
         <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <PlusCircle className="w-4 h-4" /> Nouvelle Dépense
         </button>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl border border-black/5 dark:border-white/5 shadow-xl overflow-hidden">
         {expenses.length === 0 ? (
           <div className="p-12 text-center text-gray-500 text-sm font-bold">Aucune dépense enregistrée.</div>
         ) : (
           <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 dark:bg-[#111111] text-xs uppercase text-gray-500 border-b border-black/5 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-widest">Date</th>
                  <th className="px-6 py-4 font-bold tracking-widest">Catégorie</th>
                  <th className="px-6 py-4 font-bold tracking-widest">Description</th>
                  <th className="px-6 py-4 font-bold tracking-widest text-right">Montant</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {expenses.map((exp: any) => (
                   <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{new Date(exp.expense_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 border border-black/5 dark:border-white/5">{exp.category}</span></td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{exp.description}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{fmt(exp.amount)}</td>
                   </tr>
                ))}
             </tbody>
           </table>
         )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0A0A0A] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/5">
            <div className="p-6 border-b border-black/5 dark:border-white/5 bg-gray-50 dark:bg-[#050505]">
               <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Déclarer une Dépense</h3>
               <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Imputation sur le P&L</p>
            </div>
            <div className="p-6 space-y-5">
               <div>
                 <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Montant (DZD)</label>
                 <input name="amount" type="number" required placeholder="Ex: 50000" className="w-full bg-gray-50 dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-bold" />
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Catégorie</label>
                 <select name="category" required className="w-full bg-gray-50 dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-bold">
                    <option value="marketing">Marketing & Acquisition</option>
                    <option value="salaries">Salaires & Charges</option>
                    <option value="rent">Loyer & Locaux</option>
                    <option value="software">Logiciels & IT</option>
                    <option value="travel">Déplacements</option>
                    <option value="equipment">Équipement</option>
                    <option value="utilities">Charges de Consommation</option>
                    <option value="other">Divers</option>
                 </select>
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Description</label>
                 <input name="description" type="text" required placeholder="Ex: Facebook Ads Octobre" className="w-full bg-gray-50 dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white" />
               </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-[#050505] flex justify-end gap-3 border-t border-black/5 dark:border-white/5">
               <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1A1A1A]">Annuler</button>
               <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-colors">Déclarer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
