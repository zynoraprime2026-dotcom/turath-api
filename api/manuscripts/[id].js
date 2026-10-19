const { withDb, send, readBody, guard, mapM } = require('../../_lib');

// GET /api/manuscripts/:id
// PUT /api/manuscripts/:id (admin) — partial update
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    const id = parseInt(req.query.id);
    if (!id) { send(res, 400, { error: 'Invalid id' }); return; }
    if (req.method === 'GET') {
      const row = await withDb(async c => (await c.query('SELECT * FROM manuscripts WHERE id=$1', [id])).rows[0]);
      if (!row) { send(res, 404, { error: 'Manuscript not found' }); return; }
      send(res, 200, { manuscript: mapM(row) });
      return;
    }
    if (req.method === 'PUT') {
      const b = await readBody(req);
      const cur = await withDb(async c => (await c.query('SELECT * FROM manuscripts WHERE id=$1', [id])).rows[0]);
      if (!cur) { send(res, 404, { error: 'Manuscript not found' }); return; }
      const F = { title: 'title', author: 'author', dateWritten: 'date_written', century: 'century', language: 'language', script: 'script', subject: 'subject', region: 'region', holding: 'holding', description: 'description', digitalUrl: 'digital_url', imageUrl: 'image_url' };
      const sets = []; const vals = [];
      for (const [k, col] of Object.entries(F)) {
        if (b[k] !== undefined) {
          vals.push(k === 'century' ? (parseInt(b[k]) || null) : String(b[k]).slice(0, 4000));
          sets.push(`${col} = $${vals.length}`);
        }
      }
      if (!sets.length) { send(res, 400, { error: 'No valid fields to update' }); return; }
      vals.push(id);
      const row = await withDb(async c => (await c.query(`UPDATE manuscripts SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING *`, vals)).rows[0]);
      send(res, 200, { ok: true, manuscript: mapM(row) });
      return;
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
