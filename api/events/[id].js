const { withDb, send, readBody, guard, mapE } = require('../_lib');

// GET /api/events/:id
// PUT /api/events/:id (admin)
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    const id = parseInt(req.query.id);
    if (!id) { send(res, 400, { error: 'Invalid id' }); return; }
    if (req.method === 'GET') {
      const row = await withDb(async c => (await c.query('SELECT * FROM historical_events WHERE id=$1', [id])).rows[0]);
      if (!row) { send(res, 404, { error: 'Event not found' }); return; }
      send(res, 200, { event: mapE(row) });
      return;
    }
    if (req.method === 'PUT') {
      const b = await readBody(req);
      const cur = await withDb(async c => (await c.query('SELECT * FROM historical_events WHERE id=$1', [id])).rows[0]);
      if (!cur) { send(res, 404, { error: 'Event not found' }); return; }
      const F = { title: 'title', titleAr: 'title_ar', yearHijri: 'year_hijri', yearGregorian: 'year_gregorian', category: 'category', region: 'region', description: 'description', descriptionAr: 'description_ar', sources: 'sources', sourceUrl: 'source_url' };
      const sets = []; const vals = [];
      for (const [k, col] of Object.entries(F)) {
        if (b[k] !== undefined) {
          vals.push((k === 'yearHijri' || k === 'yearGregorian') ? (parseInt(b[k]) || null) : String(b[k]).slice(0, 4000));
          sets.push(`${col} = $${vals.length}`);
        }
      }
      if (!sets.length) { send(res, 400, { error: 'No valid fields to update' }); return; }
      vals.push(id);
      const row = await withDb(async c => (await c.query(`UPDATE historical_events SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING *`, vals)).rows[0]);
      send(res, 200, { ok: true, event: mapE(row) });
      return;
    }
    if (req.method === 'DELETE') {
      const deleted = await withDb(async c => (await c.query('DELETE FROM historical_events WHERE id=$1 RETURNING *', [id])).rows[0]);
      if (!deleted) { send(res, 404, { error: 'Event not found' }); return; }
      send(res, 200, { ok: true, deleted: mapE(deleted) });
      return;
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
