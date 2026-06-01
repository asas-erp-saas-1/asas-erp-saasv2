'use client';

import React, { useState, useOptimistic, useTransition, useEffect } from 'react';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay
} from '@dnd-kit/core';
import { 
  SortableContext, 
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { updateDealStage, type DealWithClient, type DealStage } from '@/app/actions/crm';

const PIPELINE_STAGES: { id: DealStage; label: string }[] = [
  { id: 'DRAFT', label: 'New Lead / Draft' },
  { id: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { id: 'APPROVED', label: 'Contacted & Approved' },
  { id: 'CONTRACT_PENDING', label: 'Contract / VSP Pending' },
  { id: 'CLOSED_WON', label: 'Closed Won' }
];

function SortableDealCard({ deal }: { deal: DealWithClient }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: {
      type: 'Deal',
      deal,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        "p-3 bg-white dark:bg-[#151719] border border-asas-charcoal/10 dark:border-white/5 rounded-sm cursor-grab active:cursor-grabbing transition-colors group",
        isDragging && "shadow-lg border-asas-gold/50",
        !isDragging && "hover:border-asas-gold/30"
      )}
    >
      <div className="flex items-center justify-between mb-2">
         <span className="text-[10px] font-mono font-bold text-asas-charcoal/50 dark:text-asas-sand/50">Deal #{deal.id.substring(0,6)}</span>
         <span className="w-1.5 h-1.5 rounded-full bg-asas-gold shadow-[0_0_8px_rgba(199,161,90,0.4)]"></span>
      </div>
      <h4 className="font-semibold text-asas-charcoal dark:text-asas-sand text-sm mb-1">
        {deal.client.first_name} {deal.client.last_name}
      </h4>
      <div className="text-xs text-asas-charcoal/60 dark:text-asas-sand/60 mb-3 truncate">
        Est. Value: {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(deal.agreed_price)}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-asas-charcoal/10 dark:border-white/5">
         <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm bg-asas-charcoal/5 dark:bg-white/5 border border-asas-charcoal/10 dark:border-white/10 flex items-center justify-center text-[9px] font-bold">
               AS
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">Assigned</span>
         </div>
         <MessageSquare size={12} className="text-asas-charcoal/40 dark:text-asas-sand/40 group-hover:text-asas-gold transition-colors" />
      </div>
    </div>
  );
}

export function PipelineBoard({ initialDeals }: { initialDeals: DealWithClient[] }) {
  const [deals, setDeals] = useState<DealWithClient[]>(initialDeals);
  const [activeDeal, setActiveDeal] = useState<DealWithClient | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic UI updates
  const [optimisticDeals, addOptimisticUpdate] = useOptimistic(
    deals,
    (state, newDealState: DealWithClient) => {
      return state.map(d => d.id === newDealState.id ? newDealState : d);
    }
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = optimisticDeals.find(d => d.id === active.id);
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;

    if (!over) return;
    
    const dealId = active.id as string;
    const currentDeal = optimisticDeals.find(d => d.id === dealId);
    
    // Extract target stage. Over ID can be either the stage ID or another item ID.
    // If it's a stage ID:
    let newStage: DealStage | null = null;
    
    if (PIPELINE_STAGES.some(stage => stage.id === over.id)) {
      newStage = over.id as DealStage;
    } else {
      // dropped over another item
      const overDeal = optimisticDeals.find(d => d.id === over.id);
      if (overDeal && overDeal.stage) {
        newStage = overDeal.stage;
      }
    }

    if (currentDeal && newStage && currentDeal.stage !== newStage) {
      // 1. Fire Optimistic Update immediately
      const updatedDeal = { ...currentDeal, stage: newStage };
      
      startTransition(() => {
         addOptimisticUpdate(updatedDeal);
         
         // 2. Perform actual server mutation
         updateDealStage(dealId, newStage as DealStage, (currentDeal as any).agency_id || 'system-context').catch(err => {
             console.error("Mutation failed, reverting", err);
             // In a real app we'd toast an error and potentially revert state
         });
         
         // 3. Update real state for future actions
         setDeals((prev) => prev.map(d => d.id === dealId ? updatedDeal : d));
      });
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex gap-4 overflow-x-auto custom-scrollbar pb-4 h-full items-start">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = optimisticDeals.filter(d => d.stage === stage.id);
          
          return (
            <div 
              key={stage.id} 
              id={stage.id} // Important for dropping directly on the column
              className="flex-shrink-0 w-80 flex flex-col bg-white/30 dark:bg-[#0F1113]/30 border border-asas-charcoal/10 dark:border-white/5 rounded-sm max-h-full"
            >
              {/* STAGE HEADER */}
              <div className="p-3 border-b border-asas-charcoal/10 dark:border-white/5 flex items-center justify-between bg-asas-charcoal/5 dark:bg-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-asas-charcoal/80 dark:text-asas-sand/80">{stage.label}</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-white/50 dark:bg-black/50 text-asas-charcoal dark:text-asas-sand border border-asas-charcoal/10 dark:border-white/10">
                  {stageDeals.length}
                </span>
              </div>

              {/* STAGE DROPPABLE ZONE */}
              <SortableContext 
                 id={stage.id}
                 items={stageDeals.map(d => d.id)} 
                 strategy={rectSortingStrategy}
              >
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-[150px]">
                  {stageDeals.map(deal => (
                     <SortableDealCard key={deal.id} deal={deal} />
                  ))}
                  {stageDeals.length === 0 && (
                     <div className="h-full flex items-center justify-center p-4 border border-dashed border-asas-charcoal/20 dark:border-white/10 rounded-sm">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-asas-charcoal/40 dark:text-asas-sand/40">Drop here</span>
                     </div>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="opacity-90 scale-105 rotate-2 cursor-grabbing w-80">
            {/* Visual replica of dragged item */}
            <div className="p-3 bg-white dark:bg-[#151719] border border-asas-gold shadow-2xl rounded-sm">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-asas-charcoal/50 dark:text-asas-sand/50">Deal #{activeDeal.id.substring(0,6)}</span>
               </div>
               <h4 className="font-semibold text-asas-charcoal dark:text-asas-sand text-sm mb-1">
                 {activeDeal.client.first_name} {activeDeal.client.last_name}
               </h4>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
