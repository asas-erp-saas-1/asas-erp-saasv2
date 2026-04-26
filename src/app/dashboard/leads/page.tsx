// src/app/dashboard/leads/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Plus, Search, Phone, MessageCircle, Clock, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import type { Lead } from '@/types/app'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

// ─── Kanban column definitions ────────────────────────────────────────────────
const COLUMNS = [
  { key: 'new',             label: 'Nouveau',           color: 'bg-gray-100 text-gray-700',       dot: 'bg-gray-400' },
  { key: 'contacted',       label: 'Contacté',          color: 'bg-blue-100 text-blue-700',        dot: 'bg-blue-500' },
  { key: 'interested',      label: 'Intéressé',         color: 'bg-amber-100 text-amber-700',      dot: 'bg-amber-500' },
  { key: 'visit_scheduled', label: 'Visite Prévue',     color: 'bg-purple-100 text-purple-700',    dot: 'bg-purple-500' },
  { key: 'converted',       label: 'Converti',          color: 'bg-emerald-100 text-emerald-700',  dot: 'bg-emerald-500' },
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
            'bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none',
            isStale ? 'border-orange-200' : 'border-gray-200',
            snapshot.isDragging && 'shadow-xl ring-2 ring-[#1A2A4A] rotate-2 scale-105 z-50'
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate text-sm">
                {(lead as any).clients?.full_name ?? 'Client Inconnu'}
              </p>
              {(lead as any).clients?.phone && (
                <p className="text-xs text-gray-500 mt-0.5">{(lead as any).clients.phone}</p>
              )}
            </div>
            {isHot  && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-bold shrink-0">🔥 Chaud</span>}
            {isStale && <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-md font-bold shrink-0">⚠️ Inactif</span>}
          </div>

          {/* Source + project */}
          <div className="flex items-center gap-2 mb-3">
            {lead.source && (
              <span className="text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{lead.source}</span>
            )}
            {(lead as any).projects?.name && (
              <span className="text-xs text-gray-500 truncate bg-gray-50 px-2 py-0.5 rounded-md">{(lead as any).projects.name}</span>
            )}
          </div>

          {/* Budget */}
          {(lead.budget_min || lead.budget_max) && (
            <div className="text-xs text-gray-600 mb-3 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
              <span className="text-blue-900 font-semibold mb-1 block text-[10px] uppercase tracking-wider">Budget Client</span>
              <span className="font-medium text-blue-700">
                {lead.budget_min ? fmt(lead.budget_min) : '?'} {' → '} {lead.budget_max ? fmt(lead.budget_max) : '?'}
              </span>
            </div>
          )}

          {/* Inactivity warning */}
          {isStale && (
            <p className="text-xs text-orange-600 flex items-center gap-1.5 mb-3 font-medium bg-orange-50 px-2 py-1 rounded-md">
              <Clock className="h-3 w-3" />
              Inactif depuis {Math.floor(hours)}h
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <button className="flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Appeler">
              <Phone className="h-4 w-4" />
            </button>
            <button className="flex items-center justify-center p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition-colors" title="Message WhatsApp">
              <MessageCircle className="h-4 w-4" />
            </button>
            {lead.status !== 'converted' && (
              <button
                onClick={(e) => { e.stopPropagation(); onConvert(lead.id) }}
                className="ml-auto flex items-center gap-1 text-xs font-semibold bg-[#1A2A4A] text-white px-3 py-1.5 rounded-lg hover:bg-[#243554] transition-colors shadow-sm"
              >
                Créer Deal <ArrowRight className="h-3 w-3" />
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
      // Background update
      const res = await fetch(`/api/leads/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        throw new Error('Failed to update status')
      }
    } catch (e) {
      console.error(e)
      // Revert on error
      load()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 shrink-0 z-10 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" /> Pipeline des Leads
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1">{total} leads actifs dans le pipeline</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Chercher nom, téléphone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-sm border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A2A4A]/20 focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 shrink-0 bg-[#1A2A4A] text-white rounded-xl text-sm font-semibold hover:bg-[#243554] hover:shadow-md transition-all active:scale-95">
              <Plus className="h-4 w-4" /> Nouveau Lead
            </button>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50/50">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full gap-6 p-6 min-w-max items-start">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="w-80 bg-white rounded-2xl border border-gray-100 animate-pulse h-[80vh]" />
              ))
            ) : (
              activeColumns.map(col => {
                const colLeads = byStatus(col.key)
                return (
                  <div key={col.key} className="w-80 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-200/60 overflow-hidden max-h-full">
                    {/* Column header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center justify-between shrink-0 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className={clsx('h-2.5 w-2.5 rounded-full shadow-sm', col.dot)} />
                        <span className="text-sm font-bold text-gray-900">{col.label}</span>
                      </div>
                      <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-md border', col.color)}>
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
                            "flex-1 overflow-y-auto p-4 space-y-4 transition-colors min-h-[150px]",
                            snapshot.isDraggingOver ? "bg-blue-50/40" : ""
                          )}
                        >
                          {colLeads.length === 0 && !snapshot.isDraggingOver ? (
                            <div className="flex flex-col items-center justify-center p-8 mt-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                              <Users className="h-8 w-8 mb-2 opacity-50" />
                              <span className="text-sm font-medium">Aucun lead</span>
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
            <div className="w-64 flex flex-col bg-emerald-50/50 rounded-2xl border border-emerald-100 overflow-hidden max-h-[80vh]">
              <div className="px-5 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="text-sm font-bold text-emerald-900">Signé</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                  {byStatus('converted').length}
                </span>
              </div>
              <Droppable droppableId="converted" isDropDisabled={true}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 overflow-y-auto p-4 space-y-3"
                  >
                    {byStatus('converted').map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index} isDragDisabled>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="bg-white rounded-xl border border-emerald-100 p-3 shadow-sm"
                          >
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {(lead as any).clients?.full_name ?? 'Inconnu'}
                            </p>
                            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                              Transferé en Deal
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
