const { withDb, send, guard, mapM } = require('../_lib');

// GET /api/manuscripts/daily — deterministic "Manuscript of the Day".
// The same manuscript is returned for the whole UTC day, cycling through
// the archive: index = dayNumber % count.
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    const row = await withDb(async c => {
      const n = (await c.query('SELECT COUNT(*) AS n FROM manuscripts')).rows[0].n;
      if (!n) return null;
      const now = new Date();
      const dayIndex = Math.floor(now.getTime() / 86400000);
      const pick = (dayIndex % n) + 1;
      // stable ordering by id for the daily cycle
      return (await c.query('SELECT * FROM manuscripts ORDER BY id LIMIT 1 OFFSET $1', [pick - 1])).rows[0];
    });
    if (!row) { send(res, 404, { error: 'No manuscripts in the database yet' }); return; }
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const m = mapM(row);
    send(res, 200, { date, manuscript: m, shareUrl: `https://turath-green.vercel.app/#m/${m.id}` });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
