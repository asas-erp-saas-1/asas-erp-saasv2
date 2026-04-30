// src/app/dashboard/leads/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Plus, Search, Phone, MessageCircle, Clock, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import type { Lead } from '@/types/app'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

// ─── Kanban column definitions ────────────────────────────────────────────────
const COLUMNS = [
  { key: 'new',             label: 'Nouveau',           color: 'bg-[#1A1A1A] border-white/5 text-gray-300',       dot: 'bg-gray-500' },
  { key: 'contacted',       label: 'Contacté',          color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',        dot: 'bg-blue-500' },
  { key: 'interested',      label: 'Intéressé',         color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',      dot: 'bg-amber-500' },
  { key: 'visit_scheduled', label: 'Visite Prévue',     color: 'bg-purple-500/10 border-purple-500/20 text-purple-400',    dot: 'bg-purple-500' },
  { key: 'converted',       label: 'Converti',          color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',  dot: 'bg-emerald-500' },
] as const

type LeadStatus = typeof COLUMNS[number]['key']

function inactiveHours(lastActivity: string): number {
  return (Date.now() - new Date(lastActivity).getTime()) / 3_600_000
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M DZD'
  return new Intl.NumberFormat('fr-DZ').format(n) + ' DZD'
}

// ─── Lead card ────────────────────────────────────────────────────────────────
function LeadCard({ lead, onConvert, index }: { lead: Lead; onConvert: (id: string) => void; index: number }) {
  const hours  = inactiveHours(lead.last_activity)
  const isHot  = hours < 24
  const isStale = hours > 48

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={clsx(
            'bg-[#121212] rounded-xl border p-4 shadow-lg transition-all cursor-grab active:cursor-grabbing select-none hover:bg-[#181818]',
            isStale ? 'border-orange-500/30' : 'border-white/10',
            snapshot.isDragging && 'shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/50 rotate-2 scale-105 z-50'
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate text-sm">
                {(lead as any).clients?.full_name ?? 'Client Inconnu'}
              </p>
              {(lead as any).clients?.phone && (
                <p className="text-xs text-gray-400 mt-1 font-mono tracking-wide">{(lead as any).clients.phone}</p>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              {isHot  && <span className="text-[10px] uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-bold shrink-0">🔥 Actif</span>}
              {isStale && <span className="text-[10px] uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md font-bold shrink-0">⚠️ Inactif</span>}
            </div>
          </div>

          {/* Source + project */}
          <div className="flex items-center gap-2 mb-4">
            {lead.source && (
              <span className="text-[10px] uppercase font-bold tracking-wider bg-[#050505] border border-white/5 text-gray-500 px-2 py-0.5 rounded-md">{lead.source}</span>
            )}
            {(lead as any).projects?.name && (
              <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/5 border border-blue-500/10 text-blue-400 truncate px-2 py-0.5 rounded-md">{(lead as any).projects.name}</span>
            )}
          </div>

          {/* Budget */}
          {(lead.budget_min || lead.budget_max) && (
            <div className="mb-4 bg-black/40 p-2.5 rounded-lg border border-white/5">
              <span className="text-gray-500 font-bold mb-1 block text-[10px] uppercase tracking-widest">Projection Finance</span>
              <span className="font-bold text-gray-300 text-xs">
                {lead.budget_min ? fmt(lead.budget_min) : '?'} {' → '} {lead.budget_max ? fmt(lead.budget_max) : '?'}
              </span>
            </div>
          )}

          {/* Inactivity warning */}
          {isStale && (
            <p className="text-[10px] uppercase tracking-widest text-orange-400 flex items-center gap-1.5 mb-4 font-bold bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-md">
              <Clock className="h-3 w-3" />
              Latence: {Math.floor(hours)}h
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-white/5">
            <button className="flex items-center justify-center p-2 border border-white/5 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Initier Appel">
              <Phone className="h-4 w-4" />
            </button>
            <button className="flex items-center justify-center p-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-all" title="Message Chiffré">
              <MessageCircle className="h-4 w-4" />
            </button>
            {lead.status !== 'converted' && (
              <button
                onClick={(e) => { e.stopPropagation(); onConvert(lead.id) }}
                className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-white text-black px-3 py-2 rounded-lg hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                Promouvoir <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [total,   setTotal]   = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/leads?limit=100')
      const data = await res.json()
      setLeads(data.data ?? [])
      setTotal(data.count ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleConvert(leadId: string) {
    // Navigate to new deal form pre-filled with lead
    window.location.href = `/dashboard/deals/new?leadId=${leadId}`
  }

  // Filter by search
  const filtered = search.trim()
    ? leads.filter(l =>
        (l as any).clients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        (l as any).clients?.phone?.includes(search) ||
        (l as any).projects?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : leads

  // Group by status
  const byStatus = (status: string) => filtered.filter(l => l.status === status)
  const activeColumns = COLUMNS.filter(c => c.key !== 'converted')

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as LeadStatus
    
    // Optimistic update
    setLeads(current => current.map(lead => 
      lead.id === draggableId ? { ...lead, status: newStatus as any } : lead
    ))

    try {
      // Background update via Server Action
      const { updateLeadStatusAction } = await import('@/actions/leadActions')
      await updateLeadStatusAction(draggableId, newStatus)
    } catch (e) {
      console.error(e)
      // Revert on error
      load()
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-[#050505] rounded-2xl shadow-2xl border border-white/5 overflow-hidden text-gray-100">
      {/* Header */}
      <div className="bg-[#0A0A0A] border-b border-white/5 px-6 py-5 shrink-0 z-10 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-2">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-3 tracking-tight">
              <Users className="h-5 w-5 text-gray-400" /> Pipeline d'Acquisition
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-2">{total} entités actives détectées</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Scanner matricule ou identifiant..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#050505] text-sm font-medium border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white transition-all placeholder:text-gray-600"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-5 py-3 shrink-0 bg-white text-black rounded-xl text-xs font-bold hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all transform hover:scale-[1.02] active:scale-95">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Ajouter Entité
            </button>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#000000]">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full gap-4 p-6 min-w-max items-start">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="w-[340px] bg-[#0A0A0A] rounded-2xl border border-white/5 animate-pulse h-[80vh]" />
              ))
            ) : (
              activeColumns.map(col => {
                const colLeads = byStatus(col.key)
                return (
                  <div key={col.key} className="w-[340px] flex flex-col bg-[#0A0A0A] rounded-2xl border border-white/5 overflow-hidden max-h-full">
                    {/* Column header */}
                    <div className="px-5 py-4 border-b border-white/5 bg-[#0A0A0A] flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <div className={clsx('h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]', col.dot)} />
                        <span className="text-sm font-bold text-gray-200 tracking-wide">{col.label}</span>
                      </div>
                      <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-widest', col.color)}>
                        {colLeads.length}
                      </span>
                    </div>

                    {/* Droppable Area */}
                    <Droppable droppableId={col.key}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={clsx(
                            "flex-1 overflow-y-auto p-4 space-y-4 transition-colors min-h-[150px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10",
                            snapshot.isDraggingOver ? "bg-[#121212]" : ""
                          )}
                        >
                          {colLeads.length === 0 && !snapshot.isDraggingOver ? (
                            <div className="flex flex-col items-center justify-center p-8 mt-4 border border-dashed border-white/10 rounded-xl text-gray-600 bg-white/5">
                              <Users className="h-6 w-6 mb-3 opacity-50" />
                              <span className="text-xs uppercase tracking-widest font-bold">Zone Vide</span>
                            </div>
                          ) : (
                            colLeads.map((lead, index) => (
                              <LeadCard key={lead.id} lead={lead} index={index} onConvert={handleConvert} />
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })
            )}

            {/* Converted column — compact */}
            <div className="w-[280px] flex flex-col bg-[#050A05] rounded-2xl border border-emerald-500/20 overflow-hidden max-h-[80vh] opacity-80 hover:opacity-100 transition-opacity">
              <div className="px-5 py-4 border-b border-emerald-500/10 bg-emerald-500/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Transfert</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  {byStatus('converted').length}
                </span>
              </div>
              <Droppable droppableId="converted" isDropDisabled={true}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"
                  >
                    {byStatus('converted').map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index} isDragDisabled>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="bg-[#0A0A0A] rounded-xl border border-emerald-500/10 p-3 shadow-sm flex items-center justify-between"
                          >
                            <p className="text-[10px] font-bold text-gray-300 truncate tracking-wide">
                              {(lead as any).clients?.full_name ?? 'Inconnu'}
                            </p>
                            <span className="text-[8px] uppercase font-bold text-emerald-500/50 tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              Deal
                            </span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
