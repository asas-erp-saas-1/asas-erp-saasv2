import { withEEK } from '@/eek/withEEK';
import { NextRequest, NextResponse } from 'next/server';
import { ErrorTracker } from '@/lib/observability/errors';
import { v4 as uuidv4 } from 'uuid';

export const POST = withEEK({
  resource: 'system',
  action: 'write',
  handler: async (ctx, req: NextRequest) => {
  try {
    const identity = { tenantId: ctx.organizationId, userId: ctx.session.user.id };
    if (identity.role !== 'owner' && identity.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Attempt to seed data for testing
    // 1. Create a Developer
    const developerResult: any = await /* @todo fix */ ctx.db.insert('developers', 'INSERT', {
        agency_id: identity.tenantId,
        name: 'Sarl Immobilier ASAS',
        country: 'Algeria',
        phone: '+213 550 11 22 33',
        email: 'contact@asas-promo.dz',
        rating: 4.5
    });

    const devId = developerResult.id;

    // 2. Create a Project
    const projectResult: any = await /* @todo fix */ ctx.db.insert('projects', 'INSERT', {
        agency_id: identity.tenantId,
        developer_id: devId,
        name: 'Résidence Les Jasmins',
        city: 'Algiers',
        location: 'Cheraga',
        description: 'High end apartments with pool and gym',
    });

    const projectId = projectResult.id;

    // 3. Create properties
    const prop1: any = await /* @todo fix */ ctx.db.insert('properties', 'INSERT', {
        agency_id: identity.tenantId,
        project_id: projectId,
        reference_code: 'JAS-001',
        type: 'f3',
        floor: 1,
        rooms: '3',
        area_sqm: 85.5,
        list_price: 18500000
    });

    await /* @todo fix */ ctx.db.insert('properties', 'INSERT', {
        agency_id: identity.tenantId,
        project_id: projectId,
        reference_code: 'JAS-002',
        type: 'f4',
        floor: 2,
        rooms: '4',
        area_sqm: 110.0,
        list_price: 24000000
    });

    // 4. Create a Lead
    const leadResult: any = await /* @todo fix */ ctx.db.insert('leads', 'INSERT', {
        agency_id: identity.tenantId,
        agent_id: identity.userId,
        full_name: 'Amine B.',
        phone: '0655123456',
        email: 'amine@example.dz',
        source: 'facebook',
        status: 'new'
    });

    // 5. Create a Client
    const clientResult: any = await /* @todo fix */ ctx.db.insert('clients', 'INSERT', {
        agency_id: identity.tenantId,
        full_name: 'Omar T.',
        phone: '0770987654',
        type: 'buyer',
        source: 'walk_in',
        nationality: 'Algérienne'
    });

    return NextResponse.json({ success: true, message: 'Applet successfully provisioned with operational data schema!' });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'System Seed API' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});
