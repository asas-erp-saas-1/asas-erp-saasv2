'use client'

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, BookOpen, Clock, FileText, CheckCircle, ArrowRight, X, Save, AlertCircle, Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

export function AccountingLedger() {
  const [journals, setJournals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<{accountId: string, amount: string, entryType: 'debit'|'credit'}[]>([
     { accountId: '', amount: '', entryType: 'debit' },
     { accountId: '', amount: '', entryType: 'credit' }
  ]);
  const [saving, setSaving] = useState(false);

  const fetchAccounts = async () => {
     try {
       const res = await fetch('/api/ledger/accounts');
       const json = await res.json();
       if (json.success) setAccounts(json.data);
     } catch (e) {}
  };

  const fetchJournals = async () => {
    try {
      const res = await fetch('/api/accounting/journal');
      const json = await res.json();
      if (json.success) setJournals(json.data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
    fetchJournals();
  }, []);

  const totalDebit = lines.reduce((acc, l) => acc + (l.entryType === 'debit' ? Number(l.amount || 0) : 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (l.entryType === 'credit' ? Number(l.amount || 0) : 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSave = async () => {
     if (!isBalanced) {
        toast.error('Général Ledger requires debits to strictly equal credits.');
        return;
     }

     setSaving(true);
     try {
        const res = await fetch('/api/accounting/journal', {
           method: 'POST',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({ description, lines })
        });
        const json = await res.json();
        if (json.success) {
           toast.success('Journal Entry successfully committed.');
           setIsAdding(false);
           setLines([{ accountId: '', amount: '', entryType: 'debit' }, { accountId: '', amount: '', entryType: 'credit' }]);
           setDescription('');
           fetchJournals();
        } else {
           toast.error(json.error || 'Failed to insert entry.');
        }
     } catch (err) {
        toast.error('Network Error');
     } finally {
        setSaving(false);
     }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-500 bg-transparent text-white pt-4 md:pt-4 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5 relative w-full mt-4 md:mt-0">
        <div>
          <div className="flex items-center gap-2 mb-2 hidden sm:flex">
            <div className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-[9px] text-[#D4A64F] uppercase font-bold tracking-widest flex items-center gap-1">
               <BookOpen className="w-3 h-3" />
               <span>General Ledger Active</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3 font-display">
            Accounting Ledger
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#D4A64F] mt-2 flex items-center gap-2 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-asas-gold animate-[ping_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(212,166,79,0.6)]" />
            Oracle ERP Logic • Immutable Double-Entry Transactions
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button 
             onClick={() => setIsAdding(!isAdding)}
             className="flex w-full md:w-auto items-center justify-center gap-2 px-6 py-3 md:py-2.5 shrink-0 bg-[#D4A64F] hover:bg-[#E0B96B] text-[#051121] rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(212,166,79,0.3)] transition-all active:scale-95 border border-transparent outline-none">
             {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
             {isAdding ? "Cancel Entry" : "Manual Entry"}
           </button>
        </div>
      </div>

      {isAdding && (
         <div className="bg-[#0A1829] border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <h2 className="text-lg font-display font-bold text-white">Create Journal Entry</h2>
                <div className="flex items-center gap-4">
                   <div className="flex gap-4 text-xs font-bold font-mono">
                      <div className="flex flex-col">
                         <span className="text-white/40 mb-1 tracking-widest uppercase text-[9px]">Total Debit</span>
                         <span className={clsx("text-xl", totalDebit === totalCredit ? "text-green-400" : "text-white")}>{totalDebit.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-white/40 mb-1 tracking-widest uppercase text-[9px]">Total Credit</span>
                         <span className={clsx("text-xl", totalDebit === totalCredit ? "text-green-400" : "text-white")}>{totalCredit.toLocaleString()}</span>
                      </div>
                   </div>
                </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 block mb-2">Description / Libellé</label>
                  <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Paiement cautionnement fournisseur A"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-yellow-500/50 outline-none transition-colors"
                  />
               </div>

               <div className="space-y-2 mt-4">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 block mb-2">Transaction Lines</label>
                  {lines.map((l, i) => (
                     <div key={i} className="flex gap-2 items-center">
                        <select
                           value={l.accountId}
                           onChange={(e) => { const n = [...lines]; n[i].accountId = e.target.value; setLines(n); }}
                           className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-yellow-500/50 outline-none transition-colors"
                        >
                           <option value="" disabled>Select Chart of Accounts ID...</option>
                           {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                           ))}
                        </select>

                        <select
                           value={l.entryType}
                           onChange={(e) => { const n = [...lines]; n[i].entryType = e.target.value as any; setLines(n); }}
                           className="w-32 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                        >
                           <option value="debit">DEBIT</option>
                           <option value="credit">CREDIT</option>
                        </select>

                        <input 
                           type="number"
                           value={l.amount}
                           onChange={(e) => { const n = [...lines]; n[i].amount = e.target.value; setLines(n); }}
                           placeholder="0.00"
                           className="w-40 font-mono bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-yellow-500/50 outline-none text-right"
                        />
                        
                        <button 
                           onClick={() => {
                              if (lines.length > 2) {
                                 const n = [...lines]; n.splice(i, 1); setLines(n);
                              }
                           }}
                           className="w-10 h-10 flex items-center justify-center border border-red-500/20 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-30"
                           disabled={lines.length <= 2}
                        >
                           <X className="w-4 h-4" />
                        </button>
                     </div>
                  ))}
                  <button 
                     onClick={() => setLines([...lines, { accountId: '', amount: '', entryType: 'debit' }])}
                     className="mt-2 text-xs font-bold text-yellow-500 hover:text-yellow-400 flex items-center gap-1 uppercase tracking-widest"
                  >
                     <Plus className="w-3 h-3" /> Add Line
                  </button>
               </div>

               <div className="pt-6 flex justify-end">
                  <button 
                     onClick={handleSave}
                     disabled={!isBalanced || !description || saving || lines.some(l => !l.accountId || !l.amount)}
                     className="flex items-center gap-2 px-8 py-3 bg-[#D4A64F] disabled:bg-white/5 disabled:text-white/30 text-[#051121] rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                     {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     Commit to Ledger
                  </button>
               </div>
            </div>
         </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
        </div>
      ) : journals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[#0A1829] rounded-2xl border border-white/5">
          <div className="text-center relative z-10 flex flex-col items-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
              <BookOpen className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold font-display text-white mb-2 tracking-tight">Ledger Empty</h2>
            <p className="text-xs font-medium text-white/50 leading-relaxed max-w-sm">
              There are no double-entry transactions recorded in the General Ledger. Create a new manual entry to begin tracking.
            </p>
          </div>
        </div>
      ) : (
         <div className="space-y-4">
            {journals.map((j) => (
               <div key={j.transactionId} className="bg-[#0A1829] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
                  <div className="p-4 bg-[#051121] border-b border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                           <FileText className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                           <h3 className="text-sm font-bold text-white">{j.description}</h3>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">{j.transactionId}</span>
                              <span className="text-white/20">&bull;</span>
                              <span className="text-[10px] text-white/50">{new Date(j.createdAt).toLocaleString()}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                         <CheckCircle className="w-3 h-3" /> Balanced
                     </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-2">
                     {j.lines.map((l: any) => (
                        <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
                           <div className="flex items-center gap-3">
                              <span className={clsx(
                                 "text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded w-16 text-center shadow-inner",
                                 l.entryType === 'debit' ? "bg-white/10 text-white" : "bg-black/40 text-white/50 border border-white/5"
                              )}>
                                 {l.entryType}
                              </span>
                              <span className="text-sm font-medium text-white/80">
                                 <span className="text-yellow-500 mr-2">{l.accountCode}</span> 
                                 {l.accountName}
                              </span>
                           </div>
                           <span className={clsx(
                              "font-mono text-sm font-bold sm:text-right w-32",
                              l.entryType === 'debit' ? "text-white" : "text-white/60"
                           )}>
                              {Number(l.amount).toLocaleString()}
                           </span>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  )
}

