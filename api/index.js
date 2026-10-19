const { withDb, send } = require('./_lib');

export default async function handler(req, res) {
  try {
    let db = 'ok';
    try { await withDb(async c => (await c.query('SELECT 1')).rows); } catch (e) { db = 'error: ' + e.message; }
    send(res, 200, {
      status: 'ok',
      service: 'Turath API',
      tagline: 'Islamic manuscripts and history database',
      database: db,
      endpoints: [
        'GET /api/manuscripts (?q,language,subject,region,page)',
        'GET /api/manuscripts/random', 'GET /api/manuscripts/daily',
        'GET /api/manuscripts/:id', 'POST /api/manuscripts/:id/image (curator)',
        'GET /api/events (?q,category,region,page)', 'GET /api/events/:id',
        'GET /api/stats', 'POST /api/suggestions (public)',
        'GET /api/m/:id (public share page, HTML)'
      ],
      docs: 'https://turath-green.vercel.app',
      auth: 'send header x-api-key (writes also need x-admin-pass)'
    });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
