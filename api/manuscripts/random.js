const { withDb, send, guard, mapM } = require('../_lib');

// GET /api/manuscripts/random — one random manuscript
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    const row = await withDb(async c => (await c.query('SELECT * FROM manuscripts ORDER BY RANDOM() LIMIT 1')).rows[0]);
    if (!row) { send(res, 404, { error: 'No manuscripts in the database yet' }); return; }
    send(res, 200, { manuscript: mapM(row) });
  } catch (e) { send(res, 500, { error: 'Server error: ' + e.message }); }
}
