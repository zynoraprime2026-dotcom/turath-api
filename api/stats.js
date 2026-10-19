const { withDb, send, guard } = require('./_lib');

// GET /api/stats — totals and top facets
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    if (req.method !== 'GET') { send(res, 404, { error: 'Not found' }); return; }
    const stats = await withDb(async c => ({
      manuscripts: parseInt((await c.query('SELECT COUNT(*) n FROM manuscripts')).rows[0].n),
      events: parseInt((await c.query('SELECT COUNT(*) n FROM historical_events')).rows[0].n),
      byLanguage: (await c.query("SELECT language, COUNT(*) n FROM manuscripts WHERE language <> '' GROUP BY language ORDER BY n DESC LIMIT 10")).rows,
      bySubject: (await c.query("SELECT subject, COUNT(*) n FROM manuscripts WHERE subject <> '' GROUP BY subject ORDER BY n DESC LIMIT 10")).rows,
      byRegion: (await c.query("SELECT region, COUNT(*) n FROM manuscripts WHERE region <> '' GROUP BY region ORDER BY n DESC LIMIT 10")).rows,
      centuriesCovered: (await c.query('SELECT MIN(century) a, MAX(century) b FROM manuscripts WHERE century IS NOT NULL')).rows[0],
      timeline: (await c.query('SELECT MIN(year_gregorian) a, MAX(year_gregorian) b FROM historical_events WHERE year_gregorian IS NOT NULL')).rows[0]
    }));
    send(res, 200, { stats });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
