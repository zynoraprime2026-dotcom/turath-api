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
      endpoints: ['/api/manuscripts', '/api/manuscripts/random', '/api/manuscripts/:id/image (POST)', '/api/events', '/api/stats', '/api/suggestions', '/api/suggestions/:id'],
      auth: 'send header x-api-key (writes also need x-admin-pass)'
    });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
