import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch {}
    const { shift_id } = body;
    if (!shift_id) return Response.json({ error: 'shift_id required' }, { status: 400 });

    const shift = await base44.asServiceRole.entities.Shift.get(shift_id);
    if (!shift) return Response.json({ error: 'Shift not found' }, { status: 404 });
    if (shift.employee_id) return Response.json({ error: 'Shift already assigned' }, { status: 400 });

    const { items } = await base44.asServiceRole.entities.Employee.filter({ email: user.email }, { limit: 1 });
    const employee = items[0];
    if (!employee) return Response.json({ error: 'No employee profile found for your account' }, { status: 404 });

    const updated = await base44.asServiceRole.entities.Shift.update(shift_id, {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_email: employee.email,
    });

    return Response.json({ shift: updated });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}