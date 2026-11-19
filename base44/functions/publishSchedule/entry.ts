import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const DAY = 86400000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function label(date) {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Only the owner can publish the schedule' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const storeId = body.store_id;
    const weekStart = body.week_start;
    if (!storeId || !weekStart) {
      return Response.json({ error: 'store_id and week_start are required' }, { status: 400 });
    }

    const start = new Date(`${weekStart}T00:00:00Z`);
    if (isNaN(start.getTime())) {
      return Response.json({ error: 'Invalid week_start' }, { status: 400 });
    }
    const end = new Date(start.getTime() + 6 * DAY);
    const iso = (d) => d.toISOString().slice(0, 10);

    const { items: shifts } = await base44.asServiceRole.entities.Shift.filter(
      { store_id: storeId, date: { $gte: iso(start), $lte: iso(end) } },
      { limit: 500 }
    );

    const assigned = shifts.filter((s) => s.employee_email);
    if (!assigned.length) {
      return Response.json({ error: 'This week has no assigned shifts to publish' }, { status: 400 });
    }

    const store = await base44.asServiceRole.entities.Store.get(storeId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    const storeName = store?.name || 'your store';
    const weekLabel = `${label(start)} – ${label(end)}`;

    const byEmail = new Map();
    assigned.forEach((s) => {
      const entry = byEmail.get(s.employee_email) || { name: s.employee_name || '', count: 0 };
      entry.count += 1;
      byEmail.set(s.employee_email, entry);
    });

    const notifications = [...byEmail.entries()].map(([email, info]) => ({
      user_email: email,
      title: 'Schedule published',
      body: `${storeName} published the schedule for ${weekLabel}. You have ${info.count} shift${
        info.count === 1 ? '' : 's'
      } this week.`,
      link: '/my-schedule',
      read: false,
    }));
    await base44.asServiceRole.entities.Notification.bulkCreate(notifications);

    const results = await Promise.allSettled(
      [...byEmail.entries()].map(([email, info]) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          template_name: 'SchedulePublished',
          category: 'transactional',
          variables: {
            first_name: (info.name || '').split(' ')[0] || 'there',
            store_name: storeName,
            week_label: weekLabel,
            shift_count: String(info.count),
          },
        })
      )
    );

    return Response.json({
      notified: notifications.length,
      emailed: results.filter((r) => r.status === 'fulfilled').length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}