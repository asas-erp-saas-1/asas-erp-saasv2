import { withEEK } from '@/eek/withEEK';
import { NextResponse } from 'next/server';
import { parseAndValidate, taskSchema, ValidationError } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const PATCH = withEEK({
  resource: 'system',
  action: 'write',
  handler: async (ctx, request: Request, props: { params: Promise<{ id: string }> }) => {
  try {
    const identity = await { tenantId: ctx.organizationId, userId: ctx.session.user.id });
    if (!identity || identity.tenantId === 'unknown') {
       return NextResponse.json({ error: 'Unauthorized or missing tenant context.' }, { status: 401 });
    }

    const params = await props.params;
    const body = await request.json();
    
    // Server-side validation using Zod
    const validatedData = parseAndValidate(taskSchema, body, 'Task Update');
    
    const task = await /* @todo fix */ ctx.db.insert('tasks', 'UPDATE', validatedData, { 
      id: params.id, 
      organization_id: identity.tenantId 
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }
    
    return NextResponse.json({ data: task });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.field }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});
