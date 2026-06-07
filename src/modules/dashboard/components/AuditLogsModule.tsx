'use client'

import React from 'react';
import { 
  Search, Filter, Download, Activity, ShieldAlert,
  Terminal, Database, Users, Server, Eye, FileText
} from 'lucide-react';
import { clsx } from 'clsx';

export function AuditLogsModule() {
  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-700 bg-transparent text-white pt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2 border-b border-white/5 pb-6 px-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="px-2 py-1 bg-gray-500/10 border border-gray-500/20 rounded text-[9px] text-gray-400 uppercase font-bold tracking-widest flex items-center gap-1">
                <Terminal className="w-3 h-3" />
                <span>System Auditing Active</span>
             </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
             Audit & Compliance
          </h1>
          <p className="text-white/50 text-[11px] uppercase tracking-widest font-bold mt-2">Traçabilité système, logs d'activité et requêtes sécurisées</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Query Logs..." 
              className="pl-10 pr-4 py-2 bg-[#0A1829] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0A1829] border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4 text-white/50" /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-asas-gold hover:bg-[#E0B96B] text-[#051121] rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-6">
         <div className="p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#D4A64F] mb-4">Total Logs (24h)</h3>
            <span className="text-3xl font-display font-bold text-white">12,402</span>
         </div>
         <div className="p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-red-400 mb-4">Security Events</h3>
            <span className="text-3xl font-display font-bold text-red-500">14</span>
         </div>
         <div className="p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-4">Data Exports</h3>
            <span className="text-3xl font-display font-bold text-white">42</span>
         </div>
         <div className="p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-green-400 mb-4">API Requests</h3>
            <span className="text-3xl font-display font-bold text-green-400">8,102</span>
         </div>
      </div>

      <div className="flex-1 w-full bg-[#0A1829] border-t border-white/5 flex flex-col font-mono text-sm overflow-hidden">
         <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#051121] text-xs text-white/50 uppercase tracking-widest font-bold">
            <div className="w-32">Timestamp</div>
            <div className="w-24">Level</div>
            <div className="w-48">Actor</div>
            <div className="w-40">Action</div>
            <div className="flex-1">Details</div>
            <div className="w-24 text-right">IP Address</div>
         </div>
         
         <div className="flex-1 overflow-auto custom-scrollbar px-6 py-2">
            {[
               { time: '14:22:10.432', level: 'INFO', actor: 'karim.b@asas.dz', action: 'LOGIN_SUCCESS', details: 'Authentication successful via SS0', ip: '105.101.42.12' },
               { time: '14:20:05.112', level: 'WARN', actor: 'system_auth', action: 'LOGIN_FAILED', details: 'Invalid credentials. Attempt 3/5.', ip: '185.10.22.4' },
               { time: '14:15:22.001', level: 'INFO', actor: 'sarah.m@asas.dz', action: 'DATA_EXPORT', details: 'Exported Leads Table (CSV, 452 rows).', ip: 'Office Secure' },
               { time: '14:05:44.912', level: 'ERROR', actor: 'app_backend', action: 'DB_QUERY_FAILED', details: 'Timeout executing complex query on Chantiers DB', ip: 'Internal Cluster' },
               { time: '13:58:12.333', level: 'INFO', actor: 'mehdi.k@asas.dz', action: 'RESOURCE_UPDATE', details: 'Updated deal state [DEAL-921] to "Negotiation".', ip: '105.101.42.15' },
               { time: '13:45:00.000', level: 'CRITICAL', actor: 'unknown', action: 'UNAUTHORIZED_ACCESS', details: 'Attempted to access /api/v1/finance/payroll without proper scope.', ip: '192.168.1.1' },
            ].map((log, i) => (
               <div key={i} className="flex items-start py-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors gap-4">
                  <div className="w-32 text-white/40">{log.time}</div>
                  <div className="w-24">
                     <span className={clsx(
                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                        log.level === 'INFO' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        log.level === 'WARN' ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                        log.level === 'ERROR' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20"
                     )}>
                        {log.level}
                     </span>
                  </div>
                  <div className="w-48 text-white">{log.actor}</div>
                  <div className="w-40 text-asas-gold">{log.action}</div>
                  <div className="flex-1 text-white/60 truncate">{log.details}</div>
                  <div className="w-24 text-right text-white/30 truncate">{log.ip}</div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
