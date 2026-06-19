import { NextRequest, NextResponse } from "next/server";
import { kernel } from "@/lib/kernel/core";

export async function GET(req: NextRequest) {
  try {
    const identity = await kernel.identity();
    if (identity.tenantId === 'unknown') {
       return NextResponse.json({ success: true, data: [] });
    }

    const tasks = [];

    // 1. Fetch Deals needing attention
    const deals = await kernel.query<any>('deals', { 
      filters: { agency_id: identity.tenantId },
      select: 'id, status, next_action_due, properties(projects(name)), clients(full_name)'
    });

    for (const deal of deals) {
       let taskType = '';
       let title = '';
       let priority = false;

       if (deal.status === 'draft') {
          taskType = 'validate_vsp';
          title = `[VSP] Valider Contrat - ${deal.clients?.full_name}`;
          priority = true;
       } else if (deal.status === 'active' && deal.next_action_due && new Date(deal.next_action_due) < new Date()) {
          taskType = 'chase_payment';
          title = `[Paiement Retard] Relancer ${deal.clients?.full_name}`;
          priority = true;
       } else if (deal.status === 'notary') {
           taskType = 'notary_signature';
           title = `[Notaire] Obtenir Signature - ${deal.clients?.full_name}`;
       }

       if (taskType) {
         tasks.push({
           id: `deal_${deal.id}`,
           taskType,
           title,
           description: `Dossier lié au projet: ${deal.properties?.projects?.name || 'Inconnu'}`,
           status: 'pending',
           dueDate: deal.next_action_due || new Date().toISOString(),
           createdAt: new Date().toISOString(),
           priority
         });
       }
    }

    // 2. Fetch Leads needing attention (Stale)
    const leads = await kernel.query<any>('leads', {
       filters: { agency_id: identity.tenantId },
       select: 'id, status, last_activity, clients(full_name)'
    });

    for (const lead of leads) {
       const hours = lead.last_activity ? (Date.now() - new Date(lead.last_activity).getTime()) / 3600000 : 999;
       
       if (lead.status === 'new' && hours > 2) {
          tasks.push({
             id: `lead_${lead.id}`,
             taskType: 'contact_lead',
             title: `[Nouveau Lead] Contacter ${lead.clients?.full_name}`,
             description: 'La latence dépasse 2 heures.',
             status: 'pending',
             dueDate: new Date().toISOString(),
             createdAt: new Date().toISOString(),
             priority: true
          });
       } else if (lead.status === 'visiting' && hours > 48) {
          tasks.push({
             id: `lead_vis_${lead.id}`,
             taskType: 'schedule_visit',
             title: `[Relance] Client Visite - ${lead.clients?.full_name}`,
             description: 'Aucune interaction depuis plus de 48 heures.',
             status: 'pending',
             dueDate: new Date().toISOString(),
             createdAt: new Date().toISOString(),
             priority: true
          });
       }
    }

    // Sort by priority and date
    tasks.sort((a, b) => {
       if (a.priority && !b.priority) return -1;
       if (!a.priority && b.priority) return 1;
       return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const approvalReqs = await kernel.query<any>('approval_requests', {
        filters: { organization_id: identity.tenantId, status: 'pending' }
    });

    for (const req of approvalReqs) {
       tasks.unshift({
           id: `approval_${req.id}`,
           taskType: 'approval_request',
           title: `[Approbation Requise] ${req.type}`,
           description: req.reason || 'Aucune raison spécifiée.',
           status: 'pending',
           dueDate: null,
           createdAt: req.created_at,
           priority: true,
           meta: { requestId: req.id, type: req.type, entityId: req.entity_id }
       });
    }

    return NextResponse.json({ success: true, data: tasks.slice(0, 15) });
  } catch (error: any) {
    console.error("Inbox GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

