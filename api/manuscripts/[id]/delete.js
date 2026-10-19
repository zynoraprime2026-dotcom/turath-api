const { withDb, send, guard, mapM } = require('../../_lib');

// DELETE /api/manuscripts/:id/delete (admin)
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    if (req.method !== 'DELETE') { send(res, 404, { error: 'Not found' }); return; }
    const id = parseInt(req.query.id);
    const deleted = await withDb(async c => (await c.query('DELETE FROM manuscripts WHERE id=$1 RETURNING *', [id])).rows[0]);
    if (!deleted) { send(res, 404, { error: 'Manuscript not found' }); return; }
    send(res, 200, { ok: true, deleted: mapM(deleted) });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
