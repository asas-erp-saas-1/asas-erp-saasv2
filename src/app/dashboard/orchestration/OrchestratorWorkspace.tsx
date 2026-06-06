'use client'

import { useEffect, useState, useCallback } from 'react';
import { 
  Zap, CheckSquare, Clock, AlertTriangle, Play, RefreshCw, Send, CheckCircle, 
  XCircle, Lock, ShieldAlert, Wrench, Activity, FileSignature, History, 
  UserCheck, Database, Award, HelpCircle, PhoneCall, Check, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

export default function OrchestratorWorkspace() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workflows' | 'slas' | 'approvals' | 'automation' | 'recovery' | 'timeline'>('workflows');
  const [actingRole, setActingRole] = useState<'branch_manager' | 'engineer' | 'accountant' | 'owner'>('branch_manager');
  const [submittingApprovals, setSubmittingApprovals] = useState<Record<string, boolean>>({});
  const [eventTriggering, setEventTriggering] = useState(false);
  const [healingRunning, setHealingRunning] = useState<Record<string, boolean>>({});
  
  // Form input states
  const [newDepParent, setNewDepParent] = useState('');
  const [newDepChild, setNewDepChild] = useState('');
  const [depAdding, setDepAdding] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automation');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load automation engine state: ", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Simulate Event Trigger
  const handleTriggerEvent = async (eventType: string, title?: string, desc?: string, category?: string) => {
    setEventTriggering(true);
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_event',
          eventType,
          title,
          desc,
          category,
          payload: { timestamp: new Date().toISOString(), triggerCode: `SIM-${Math.random().toString(36).substring(7).toUpperCase()}` }
        })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEventTriggering(false);
    }
  };

  // Submit Approval Signature Action
  const handleApprovalDecision = async (requestId: string, stepId: string, status: 'approved' | 'rejected', comment: string) => {
    setSubmittingApprovals(prev => ({ ...prev, [stepId]: true }));
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_approval_decision',
          requestId,
          stepId,
          status,
          comment
        })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingApprovals(prev => ({ ...prev, [stepId]: false }));
    }
  };

  // Trigger Self-Healing Recovery
  const handleSelfHealing = async (jobId: string) => {
    setHealingRunning(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_recovery',
          jobId
        })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHealingRunning(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // Create Task Dependency Finish-to-Start connection
  const handleCreateDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepParent || !newDepChild || newDepParent === newDepChild) return;
    setDepAdding(true);
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_dependency',
          taskId: newDepChild,
          dependsOnTaskId: newDepParent,
          dependencyType: 'finish_to_start'
        })
      });
      if (res.ok) {
        setNewDepParent('');
        setNewDepChild('');
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDepAdding(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-white/50 animate-pulse">
        <RefreshCw className="h-8 w-8 text-asas-gold animate-spin mb-4" />
        <p className="text-[10px] uppercase font-bold tracking-widest font-mono">Connexion au moteur d'orchestration...</p>
      </div>
    );
  }

  const { layers } = data || { layers: {} };
  const { 
    tasks = [], dependencies = [], sla_policies = [], sla_violations = [], 
    automation_rules = [], automation_executions = [], approval_requests = [], 
    approval_steps = [], escalations = [], schedules = [], notifications = [], 
    recovery_jobs = [], timeline = [] 
  } = layers;

  // Render Layout
  return (
    <div className="flex-1 flex flex-col space-y-8 bg-transparent">
      {/* Banner */}
      <div className="bg-[#051121] border border-white/5 px-6 py-6 pb-8 relative group rounded-2xl shadow-xl overflow-hidden">
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
          style={{ 
            backgroundImage: 'radial-gradient(circle at center, #C7A15A 1.5px, transparent 1.5px)', 
            backgroundSize: '24px 24px' 
          }} 
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] uppercase tracking-widest bg-asas-gold/10 text-asas-gold px-2.5 py-1 rounded-[4px] border border-asas-gold/20 font-bold flex items-center gap-1.5">
                <Activity className="h-3 w-3 animate-pulse" /> Layer 1-10 Orchestrator
              </span>
              <span className="text-[9px] uppercase tracking-widest bg-white/5 text-white/60 border border-white/10 px-2 py-1 rounded-[4px] font-bold">
                 Algerian Operational Reality Enabled
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white uppercase">
              Chef d'Orchestre <span className="text-white/20 font-light mx-2">|</span> Autopilote Événementiel
            </h1>
            <p className="text-[10px] sm:text-xs text-white/50 uppercase font-bold tracking-widest mt-1.5 leading-relaxed">
              Moteur opérationnel, enforcement SLA, ordonnanceur comptable et workflows d'auto-remédiation
            </p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-asas-gold font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all rounded-xl cursor-pointer shadow-sm"
          >
            <RefreshCw className="h-4 w-4" /> Recalibrer les moteurs
          </button>
        </div>
      </div>

      {/* Interactive Simulation Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column sidebar for Event Bus Simulation Control Panel */}
        <div className="lg:col-span-1 bg-[#051121] border border-white/5 p-6 rounded-2xl flex flex-col space-y-6 shadow-sm">
          <div>
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-2 font-display">
              <Database className="h-4 w-4 text-asas-gold" /> Bus d'Événements
            </h2>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-2">
              Injecter un événement physique métier pour simuler le déclenchement en chaîne
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {/* Simulation Scenarios */}
            <h3 className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2">Scénarios Algériens Types</h3>
            
            <button
              onClick={() => handleTriggerEvent(
                'milestone.validated', 
                'Jalon Coulage Dalle Validé', 
                'Dalle Bloc A coulée et inspectée. Déclenche appel de fonds client & commande ciment pour le Bloc B.',
                'milestone'
              )}
              disabled={eventTriggering}
              className="w-full text-left p-4 bg-white/5 hover:bg-asas-gold/5 border border-white/5 hover:border-asas-gold/30 rounded-xl text-xs font-medium text-white hover:translate-x-1 transition-all flex items-start gap-2.5 group cursor-pointer shadow-sm"
            >
              <Zap className="h-4.5 w-4.5 text-asas-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[9px] text-asas-gold group-hover:text-[#E0B96B] transition-colors">Coulage Dalle Validé</p>
                <p className="text-[9px] text-white/50 font-bold uppercase mt-1 leading-relaxed">Génère appel de fonds client · Débloque ciment</p>
              </div>
            </button>

            <button
              onClick={() => handleTriggerEvent(
                'deal_payment.overdue', 
                'Appel de fonds dépassé de 5j', 
                'Versement de tranche CNEP en attente pour le client Meftah. Déclenche alerte WhatsApp automatique et relance.',
                'financial'
              )}
              disabled={eventTriggering}
              className="w-full text-left p-4 bg-white/5 hover:bg-asas-gold/5 border border-white/5 hover:border-asas-gold/30 rounded-xl text-xs font-medium text-white hover:translate-x-1 transition-all flex items-start gap-2.5 group cursor-pointer shadow-sm"
            >
              <Clock className="h-4.5 w-4.5 text-asas-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[9px] text-asas-gold group-hover:text-[#E0B96B] transition-colors">Retard Versement Tranche</p>
                <p className="text-[9px] text-white/50 font-bold uppercase mt-1 leading-relaxed">Vérifie l'échéance · Prépare alerte de recouvrement</p>
              </div>
            </button>

            <button
              onClick={() => handleTriggerEvent(
                'notary.edd_approved', 
                'État descriptif certifié par Notaire', 
                "Signature définitive de l'État descriptif de division à Blida. Débloque le pipeline du dossier crédit banque.",
                'approval'
              )}
              disabled={eventTriggering}
              className="w-full text-left p-4 bg-white/5 hover:bg-asas-gold/5 border border-white/5 hover:border-asas-gold/30 rounded-xl text-xs font-medium text-white hover:translate-x-1 transition-all flex items-start gap-2.5 group cursor-pointer shadow-sm"
            >
              <FileSignature className="h-4.5 w-4.5 text-asas-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[9px] text-asas-gold group-hover:text-[#E0B96B] transition-colors">EDD Notarié Approuvé</p>
                <p className="text-[9px] text-white/50 font-bold uppercase mt-1 leading-relaxed">Signé Maître Bouaza Blida · Débloque dossier crédit</p>
              </div>
            </button>
          </div>

          {/* Active Acting Roles for Approvals */}
          <div className="border-t border-white/5 pt-6">
            <h3 className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-4">Rôle Acteur Courant (Simulation)</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'branch_manager', label: 'Dir. Agence' },
                { key: 'engineer', label: 'Ingénieur' },
                { key: 'accountant', label: 'Comptable' },
                { key: 'owner', label: 'CEO ASAS' }
              ].map(role => (
                <button
                  key={role.key}
                  onClick={() => setActingRole(role.key as any)}
                  className={clsx(
                    'p-2.5 text-[9px] uppercase font-bold tracking-widest rounded-xl transition-all text-center cursor-pointer border',
                    actingRole === role.key 
                      ? 'bg-asas-gold border-asas-gold text-[#051121] shadow-[0_0_15px_rgba(212,166,79,0.3)]' 
                      : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>
            <p className="text-[8px] uppercase tracking-widest text-white/30 mt-3 text-center font-bold">
               Pour tester les approbations selon la hiérarchie.
            </p>
          </div>
        </div>

        {/* Right column: Tabbed detailed workspaces */}
        <div className="lg:col-span-3 flex flex-col space-y-6">
          {/* Tab Navigation selectors */}
          <div className="flex gap-2 border-b border-white/5 pb-px flex-wrap overflow-x-auto">
            {[
              { id: 'workflows', label: 'Tâches & Graphes', count: tasks.length },
              { id: 'slas', label: 'SLA & Vigies', count: sla_violations.length },
              { id: 'approvals', label: 'Approbations & Signatures', count: approval_requests.length },
              { id: 'automation', label: 'Automates & Routines', count: automation_rules.length },
              { id: 'recovery', label: 'Auto-Guérison (V1)', count: recovery_jobs.length },
              { id: 'timeline', label: 'Fil d\'Exécution', count: timeline.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'px-4 py-3 border-b-2 text-[9px] uppercase font-bold tracking-widest transition-all cursor-pointer whitespace-nowrap focus:outline-none focus:border-asas-gold flex items-center gap-1.5',
                  activeTab === tab.id 
                    ? 'border-asas-gold text-asas-gold' 
                    : 'border-transparent text-white/50 hover:text-white'
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={clsx(
                    'text-[8px] font-extrabold px-1.5 py-0.5 rounded-full min-w-4 text-center block leading-none',
                    activeTab === tab.id ? 'bg-asas-gold text-[#051121]' : 'bg-white/10 text-white/60'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* TAB CONTENT: WORKFLOWS & DEPENDENCIES */}
            {activeTab === 'workflows' && (
              <motion.div
                key="workflows"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#051121] border border-white/5 p-6 rounded-2xl space-y-8 shadow-sm flex flex-col"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                  <div>
                    <h3 className="text-sm uppercase font-extrabold tracking-widest text-white font-display flex items-center gap-2">
                      <Lock className="h-4 w-4 text-asas-gold" /> Graphe d'ordonnancement (Layer 1)
                    </h3>
                    <p className="text-[10px] text-white/50 font-bold uppercase mt-2 leading-relaxed">
                      Enforcement déterministe Finish-to-Start : Les tâches subsidiaires restent bloquées tant que les antécédents ne sont pas cochés.
                    </p>
                  </div>
                </div>

                {/* Create dependency form */}
                <form onSubmit={handleCreateDependency} className="bg-white/5 border border-white/10 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Si cette tâche finit :</label>
                    <select
                      value={newDepParent}
                      onChange={e => setNewDepParent(e.target.value)}
                      className="bg-[#0A1829] text-xs font-semibold px-4 py-2.5 border border-white/10 rounded-xl outline-none w-full text-white/80 focus:border-asas-gold/50"
                    >
                      <option value="">Sélectionner l'antécédent</option>
                      {tasks.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Débloquer cette tâche :</label>
                    <select
                      value={newDepChild}
                      onChange={e => setNewDepChild(e.target.value)}
                      className="bg-[#0A1829] text-xs font-semibold px-4 py-2.5 border border-white/10 rounded-xl outline-none w-full text-white/80 focus:border-asas-gold/50"
                    >
                      <option value="">Sélectionner le sous-dépendant</option>
                      {tasks.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={depAdding || !newDepParent || !newDepChild}
                    className="h-[42px] px-6 py-2 bg-asas-gold text-[#051121] font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#E0B96B] transition-all cursor-pointer shadow-[0_0_15px_rgba(212,166,79,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lier les tâches (DEP)
                  </button>
                </form>

                {/* List Active Dependencies */}
                {dependencies.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Liens d'ordonnancement physiques</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {dependencies.map((dep: any) => (
                        <div key={dep.id} className="p-4 bg-[#0A1829] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <span className="text-[8px] uppercase tracking-widest bg-asas-gold/10 text-asas-gold border border-asas-gold/20 px-2 py-0.5 rounded-[4px] font-bold">Finish-to-Start</span>
                            <p className="text-[10px] font-bold text-white/40 mt-3 uppercase truncate"><span className="text-white">{dep.parent_title || 'Tâche Antécédente'}</span></p>
                            <div className="w-px h-4 bg-white/10 my-1 ml-2"></div>
                            <p className="text-[10px] font-bold text-white uppercase truncate"><span className="text-red-400">🔒 Bloque :</span> {dep.child_title || 'Tâche Subséquente'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simulated list of Tasks locking */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Statut de Verrouillage des opérations chantiers</h4>
                  <div className="space-y-3">
                    {tasks.map((t: any) => {
                      const isBlocked = dependencies.some((d: any) => d.task_id === t.id);
                      return (
                        <div key={t.id} className="p-5 bg-[#0A1829] border border-white/5 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-3">
                              {t.title}
                              {isBlocked && (
                                <span className="text-[8px] uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-[4px] font-bold flex items-center gap-1.5">
                                  <Lock className="h-2.5 w-2.5" /> Verrouillé par antécédent
                                </span>
                              )}
                            </p>
                            <p className="text-[9px] uppercase tracking-widest font-bold text-white/40 mt-3">Priorité: {t.priority} · Échéance: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'ASAP'}</p>
                          </div>
                          <div>
                            {isBlocked ? (
                              <button disabled className="px-4 py-1.5 bg-red-500/5 text-red-400/50 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-red-500/10">
                                Bloqué
                              </button>
                            ) : (
                              <button disabled className="px-4 py-1.5 bg-[#4285F4]/10 text-[#4285F4] text-[9px] font-bold uppercase tracking-wider rounded-lg border border-[#4285F4]/20">
                                Prêt
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: SLA POLICIES & VIOLATIONS */}
            {activeTab === 'slas' && (
              <motion.div
                key="slas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#051121] border border-white/5 p-6 rounded-2xl space-y-8 shadow-sm flex flex-col"
              >
                <div>
                  <h3 className="text-sm uppercase font-extrabold tracking-widest text-white font-display flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-asas-gold" /> Vigie & SLAs Exécutifs (Layer 2)
                  </h3>
                  <p className="text-[10px] text-white/50 font-bold uppercase mt-2 leading-relaxed">
                    Délais impératifs de traitement opérationnels (Enforcement de rappel commerical sous 4h ou appel virement de banque Algérie).
                  </p>
                </div>

                {/* Policies List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {sla_policies.map((p: any) => (
                    <div key={p.id} className="p-5 bg-[#0A1829] border border-white/5 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] uppercase tracking-widest bg-asas-gold/10 text-asas-gold border border-asas-gold/20 px-2.5 py-1 rounded-[4px] font-extrabold">{p.target_entity} policy</span>
                        <span className="h-2 w-2 rounded-full bg-[#34A853]"></span>
                      </div>
                      <p className="text-xs font-bold text-white mt-4">{p.name}</p>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-white/40 mt-2.5">Délai Max : {p.max_duration_hours}h · Alerte à : {p.warning_threshold_hours}h</p>
                    </div>
                  ))}
                </div>

                {/* Active Violations List */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Infractions Active / Vigie de non-conformité</h4>
                  <div className="space-y-4">
                    {sla_violations.map((v: any) => (
                      <div key={v.id} className={clsx(
                        'p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 border',
                        v.status === 'resolved' ? 'bg-[#34A853]/5 border-[#34A853]/20 text-[#34A853]' : 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse'
                      )}>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={clsx(
                              'text-[8px] uppercase tracking-widest border px-2 py-0.5 rounded-[4px] font-extrabold',
                              v.status === 'resolved' ? 'bg-[#34A853]/10 border-[#34A853]/30 text-[#34A853]' : 'bg-red-500/10 border-red-500/30 text-red-500'
                            )}>
                              {v.status}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">{v.policy_name}</span>
                          </div>
                          <p className="text-xs font-bold mt-3 text-white">{v.entity_name || 'Élément Sous Jalon'}</p>
                          <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold mt-2 leading-relaxed">{v.notes}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1.5">Échéance de traitement</p>
                          <p className="text-xs font-mono font-bold text-white">{new Date(v.deadline).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: APPROVAL WORKFLOWS */}
            {activeTab === 'approvals' && (
              <motion.div
                key="approvals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#051121] border border-white/5 p-6 rounded-2xl space-y-8 shadow-sm flex flex-col"
              >
                <div>
                  <h3 className="text-sm uppercase font-extrabold tracking-widest text-white font-display flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-asas-gold" /> Ordonnancement des Approbations (Layer 4)
                  </h3>
                  <p className="text-[10px] text-white/50 font-bold uppercase mt-2 leading-relaxed">
                    Gouvernance d'approbations de bons de commandes matériel ou dérogations financières chantiers.
                  </p>
                </div>

                <div className="space-y-6">
                  {approval_requests.map((req: any) => {
                    const steps = approval_steps.filter((s: any) => s.request_id === req.id);
                    return (
                      <div key={req.id} className="p-5 bg-white/5 border border-white/5 rounded-xl shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className={clsx(
                                'text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-[4px] font-extrabold border',
                                req.status === 'approved' ? 'bg-[#34A853]/10 border-[#34A853]/30 text-[#34A853]' : 'bg-asas-gold/10 border-asas-gold/30 text-asas-gold'
                              )}>
                                {req.status}
                              </span>
                              <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{req.entity_type}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-2">{req.title}</h4>
                            <p className="text-[9px] uppercase tracking-widest text-white/40 mt-1.5 font-bold">Initié par: {req.created_by_name || 'Collaborateur'}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-xs font-mono font-bold text-asas-gold">{req.price || 'Paiement Unifié'}</span>
                          </div>
                        </div>

                        {/* Steps for this Request */}
                        <div className="pt-5 space-y-4">
                          <h5 className="text-[8px] uppercase tracking-widest text-white/40 font-bold mb-3">Visas requisitionnés</h5>
                          {steps.map((st: any) => {
                            const isCurrentStep = req.status === 'pending' && st.status === 'pending';
                            const keyString = st.id;
                            const isCompleting = submittingApprovals[keyString] || false;
                            
                            return (
                              <div key={st.id} className={clsx(
                                'p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all',
                                isCurrentStep ? 'bg-[#0A1829] border-asas-gold/40 shadow-md' : 'bg-transparent border-white/5'
                              )}>
                                <div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-white">Étape {st.step_sequence + 1}</span>
                                    <span className="text-[9px] uppercase tracking-widest bg-white/10 text-white/80 px-2 py-0.5 rounded-[4px] font-bold border border-white/10">{st.role_required}</span>
                                  </div>
                                  <p className="text-xs font-bold text-white mt-3">Assigné: {st.assigned_to_name}</p>
                                  {st.comment && (
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-white/60 mt-2 leading-relaxed">❝ {st.comment} ❞</p>
                                  )}
                                  {st.signed_checksum && (
                                    <p className="text-[8px] font-mono text-asas-gold mt-3 flex items-center gap-1.5 leading-none">
                                      <FileSignature className="h-3 w-3" /> Clé signature : {st.signed_checksum}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {st.status !== 'pending' ? (
                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-[#34A853] font-extrabold bg-[#34A853]/10 border border-[#34A853]/20 px-3 py-1.5 rounded-lg">
                                      <Check className="h-3 w-3" /> {st.status}
                                    </div>
                                  ) : isCurrentStep ? (
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => handleApprovalDecision(req.id, st.id, 'approved', 'Matériel requis pour le gros œuvre validé.')}
                                        disabled={isCompleting}
                                        className="h-9 px-4 py-2 bg-[#34A853] hover:bg-[#2e9549] text-[#051121] font-bold text-[9px] uppercase tracking-widest rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                                      >
                                        Viser & Signer
                                      </button>
                                      <button
                                        onClick={() => handleApprovalDecision(req.id, st.id, 'rejected', 'Dérogation ou commande rejetée pour manque de justificatif.')}
                                        disabled={isCompleting}
                                        className="h-9 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] uppercase tracking-widest rounded-lg cursor-pointer shadow-sm disabled:opacity-50"
                                      >
                                        Rejeter
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold">En attente</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: AUTOMATIONS */}
            {activeTab === 'automation' && (
              <motion.div
                key="automation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#051121] border border-white/5 p-6 rounded-2xl space-y-8 shadow-sm flex flex-col"
              >
                <div>
                  <h3 className="text-sm uppercase font-extrabold tracking-widest text-white font-display flex items-center gap-2">
                    <Zap className="h-4 w-4 text-asas-gold" /> Automates exécutables (Layer 3)
                  </h3>
                  <p className="text-[10px] text-white/50 font-bold uppercase mt-2 leading-relaxed">
                    Détection d'infraction, génération automatisée suite à jalon validé ou notifications en file d'attente.
                  </p>
                </div>

                {/* Automation Rules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Règles actives configurées</h4>
                    {automation_rules.map((rule: any) => (
                      <div key={rule.id} className="p-5 bg-white/5 border border-white/5 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] uppercase tracking-widest bg-asas-gold/15 text-asas-gold px-2 py-0.5 rounded-[4px] font-extrabold border border-asas-gold/20">Active rule</span>
                          <span className="text-[8px] font-mono text-white/50">{rule.trigger_event}</span>
                        </div>
                        <p className="text-xs font-bold text-white mt-4">{rule.name}</p>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-white/50 mt-2">Action: {rule.action_type} · Filtre: {rule.condition_expression}</p>
                      </div>
                    ))}
                  </div>

                  {/* Executions log */}
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Registre de Déclenchement Automatisé</h4>
                    <div className="space-y-4">
                      {automation_executions.map((e: any) => (
                        <div key={e.id} className="p-5 bg-[#0A1829] border border-white/5 rounded-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] uppercase tracking-widest text-[#34A853] font-bold border border-[#34A853]/20 bg-[#34A853]/5 px-2 py-0.5 rounded-[4px]">Success</span>
                            <span className="text-[8px] text-white/50 font-mono">{new Date(e.completed_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs font-bold text-white mt-3">{e.rule_name}</p>
                          <p className="text-[9px] uppercase tracking-widest text-white/50 mt-2 font-bold leading-relaxed">{e.execution_log}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: RECOVERY SELF HEALING */}
            {activeTab === 'recovery' && (
              <motion.div
                key="recovery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#051121] border border-white/5 p-6 rounded-2xl space-y-8 shadow-sm flex flex-col"
              >
                <div>
                  <h3 className="text-sm uppercase font-extrabold tracking-widest text-white font-display flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-asas-gold" /> Moteur d'Auto-Guérison (V1) (Layer 8)
                  </h3>
                  <p className="text-[10px] text-white/50 font-bold uppercase mt-2 leading-relaxed">
                    Correction déterministe automatique des goulots logistiques ou approbations restées bloquées sans conducteur.
                  </p>
                </div>

                {/* Recovery incident lists */}
                <div className="space-y-5">
                  {recovery_jobs.map((job: any) => {
                    const isHEALING = healingRunning[job.id] || false;
                    return (
                      <div key={job.id} className="p-6 bg-[#0A1829] border border-white/5 rounded-xl shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-white/5">
                          <div>
                            <span className={clsx(
                              'text-[8px] uppercase tracking-widest px-2.5 py-0.5 border rounded-[4px] font-extrabold',
                              job.status === 'recovered' ? 'bg-[#34A853]/10 border-[#34A853]/30 text-[#34A853]' : 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'
                            )}>
                              {job.status}
                            </span>
                            <h4 className="text-xs font-bold text-white mt-3">Incident: {job.incident_type}</h4>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-white/50 mt-1.5">{job.incident_description}</p>
                          </div>
                          <div>
                            {job.status !== 'recovered' && (
                              <button
                                onClick={() => handleSelfHealing(job.id)}
                                disabled={isHEALING}
                                className="h-10 px-5 py-2 bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold text-[9px] uppercase tracking-widest rounded-xl flex items-center gap-2 cursor-pointer shadow-sm animate-pulse disabled:opacity-50"
                              >
                                {isHEALING ? 'Correction en cours...' : 'Forcer Auto-Guérison'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="pt-5 flex flex-col gap-3">
                          <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Stratégie déployée : <span className="text-white">{job.remediation_strategy}</span></p>
                          <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                            <pre className="text-[9px] font-mono text-white/60 whitespace-pre-wrap leading-relaxed">
                              {job.output_logs}
                            </pre>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: TIMELINE */}
            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#051121] border border-white/5 p-6 rounded-2xl space-y-8 shadow-sm flex flex-col"
              >
                <div>
                  <h3 className="text-sm uppercase font-extrabold tracking-widest text-white font-display flex items-center gap-2">
                    <History className="h-4 w-4 text-asas-gold" /> Fil d'Exécution Unifié (Layer 10)
                  </h3>
                  <p className="text-[10px] text-white/50 font-bold uppercase mt-2 leading-relaxed">
                    Historique chronologique auditable et impayés d'échéances consolidé du système d'exploitation de programmes.
                  </p>
                </div>

                {/* Timeline display */}
                <div className="relative border-l border-white/10 pl-6 ml-3 space-y-8">
                  {timeline.map((item: any) => (
                    <div key={item.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-asas-gold border-[3px] border-[#051121] shadow-sm"></span>

                      <div className="bg-[#0A1829] p-4 rounded-xl border border-white/5 w-full">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[8px] uppercase tracking-widest bg-white/10 text-white/80 border border-white/5 px-2.5 py-0.5 rounded-[4px] font-bold">{item.event_category}</span>
                          <span className="text-[8px] font-mono text-white/40">{new Date(item.created_at).toLocaleTimeString()}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-2.5">{item.title}</h4>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-white/50 mt-1.5 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
