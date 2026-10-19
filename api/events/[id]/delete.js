const { withDb, send, guard, mapE } = require('../../_lib');

// DELETE /api/events/:id/delete (admin)
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    if (req.method !== 'DELETE') { send(res, 404, { error: 'Not found' }); return; }
    const id = parseInt(req.query.id);
    const deleted = await withDb(async c => (await c.query('DELETE FROM historical_events WHERE id=$1 RETURNING *', [id])).rows[0]);
    if (!deleted) { send(res, 404, { error: 'Event not found' }); return; }
    send(res, 200, { ok: true, deleted: mapE(deleted) });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
