import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch {}
    const { swap_id, action } = body;
    if (!swap_id || !action) return Response.json({ error: 'swap_id and action required' }, { status: 400 });
    if (action !== 'accept' && action !== 'decline') return Response.json({ error: 'action must be accept or decline' }, { status: 400 });

    const swap = await base44.asServiceRole.entities.SwapRequest.get(swap_id);
    if (!swap) return Response.json({ error: 'Swap request not found' }, { status: 404 });
    if (swap.status !== 'pending') return Response.json({ error: 'Swap request already processed' }, { status: 400 });

    const isTarget = !!swap.to_employee_email && !!user.email &&
      swap.to_employee_email.toLowerCase() === user.email.toLowerCase();
    const isAdmin = user.role === 'admin';
    if (!isTarget && !isAdmin) {
      return Response.json({ error: 'Only the requested employee can respond' }, { status: 403 });
    }

    if (action === 'decline') {
      await base44.asServiceRole.entities.SwapRequest.update(swap_id, { status: 'declined' });
      return Response.json({ status: 'declined' });
    }

    // accept: reassign the shift to the target employee, then mark swap accepted + owner notified
    await base44.asServiceRole.entities.Shift.update(swap.shift_id, {
      employee_id: swap.to_employee_id,
      employee_name: swap.to_employee_name,
      employee_email: swap.to_employee_email
    });
    await base44.asServiceRole.entities.SwapRequest.update(swap_id, {
      status: 'accepted',
      owner_notified: true
    });

    return Response.json({ status: 'accepted' });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}