import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const role = body?.role;
    if (role !== 'admin' && role !== 'user') {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(user.id, { role, role_selected: true });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}