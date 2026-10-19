const { withDb, send, readBody, guard, mapE } = require('./_lib');

// GET /api/events?q=&category=&region=&from=&to=&page=
// POST /api/events {title, yearHijri, yearGregorian, ...} (admin)
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    if (req.method === 'GET') {
      const q = req.query || {};
      const where = [];
      const params = [];
      if (q.q) { params.push('%' + q.q.toLowerCase() + '%'); where.push(`(LOWER(title) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`); }
      if (q.category) { params.push(q.category); where.push(`category = $${params.length}`); }
      if (q.region) { params.push(q.region); where.push(`region = $${params.length}`); }
      if (q.from) { params.push(parseInt(q.from) || -9999); where.push(`year_gregorian >= $${params.length}`); }
      if (q.to) { params.push(parseInt(q.to) || 9999); where.push(`year_gregorian <= $${params.length}`); }
      const wsql = where.length ? ' WHERE ' + where.join(' AND ') : '';
      const total = await withDb(async c => parseInt((await c.query('SELECT COUNT(*) AS n FROM historical_events' + wsql, params)).rows[0].n));
      const page = Math.max(1, parseInt(q.page) || 1);
      const per = Math.min(50, Math.max(1, parseInt(q.per) || 15));
      params.push(per); params.push((page - 1) * per);
      const rows = await withDb(async c => (await c.query('SELECT * FROM historical_events' + wsql + ` ORDER BY year_gregorian NULLS LAST LIMIT $${params.length - 1} OFFSET $${params.length}`, params)).rows);
      const facets = await withDb(async c => ({
        categories: (await c.query("SELECT category, COUNT(*) n FROM historical_events WHERE category <> '' GROUP BY category ORDER BY n DESC")).rows,
        regions: (await c.query("SELECT region, COUNT(*) n FROM historical_events WHERE region <> '' GROUP BY region ORDER BY n DESC")).rows
      }));
      send(res, 200, { total, page, per, events: rows.map(mapE), facets });
      return;
    }
    if (req.method === 'POST') {
      const b = await readBody(req);
      const title = String(b.title || '').trim();
      if (!title) { send(res, 400, { error: 'title is required' }); return; }
      const row = await withDb(async c => (await c.query(
        `INSERT INTO historical_events (title, year_hijri, year_gregorian, category, region, description, source_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [title.slice(0, 300), parseInt(b.yearHijri) || null, parseInt(b.yearGregorian) || null,
         String(b.category || '').slice(0, 80), String(b.region || '').slice(0, 100),
         String(b.description || '').slice(0, 4000), String(b.sourceUrl || '').slice(0, 500)]
      )).rows[0]);
      send(res, 201, { ok: true, event: mapE(row) });
      return;
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
