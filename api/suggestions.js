const { withDb, send, readBody, guard } = require('./_lib');

const hits = new Map(); // suggestion throttle: 10 per hour per ip
function sugOk(ip) {
  const now = Date.now(); const rec = hits.get(ip) || { n: 0, t: now };
  if (now - rec.t > 3600e3) { rec.n = 0; rec.t = now; }
  rec.n++; hits.set(ip, rec);
  return rec.n <= 10;
}

// GET /api/suggestions (admin) — list visitor suggestions, newest first
// POST /api/suggestions — visitors submit ideas for the collection (no admin pass needed, just the app key)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return; }
  const key = req.headers['x-api-key'] || '';
  const valid = (process.env.API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!key || !valid.includes(key)) { send(res, 401, { error: 'Invalid or missing x-api-key' }); return; }
  const pass = req.headers['x-admin-pass'] || '';
  const isAdmin = pass && pass === (process.env.ADMIN_PASSCODE || '');
  try {
    if (req.method === 'POST') {
      const b = await readBody(req);
      const ip = (req.headers['x-forwarded-for'] || 'local').split(',')[0].trim();
      if (!sugOk(ip)) { send(res, 429, { error: 'Too many suggestions from your device — try again later' }); return; }
      const title = String(b.title || '').trim();
      if (title.length < 2 || title.length > 200) { send(res, 400, { error: 'Title is required (2–200 characters)' }); return; }
      const f = k => String(b[k] || '').trim().slice(0, 600);
      const row = await withDb(async c => {
        const count = (await c.query("SELECT COUNT(*)::int AS n FROM suggestions WHERE status='pending'")).rows[0].n;
        if (count >= 500) throw Object.assign(new Error('Suggestion inbox is full — please try again later'), { code: 429 });
        return (await c.query(
          'INSERT INTO suggestions (title, author, language, subject, region, description, submitter) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
          [title, f('author'), f('language'), f('subject'), f('region'), f('description'), f('submitter').slice(0, 100)]
        )).rows[0];
      });
      send(res, 201, { ok: true, message: 'JazakAllah khayran! Your suggestion was received and will be reviewed.', suggestion: { id: row.id, status: row.status } });
      return;
    }
    if (req.method === 'GET') {
      if (!isAdmin) { send(res, 401, { error: 'Admin pass required to view suggestions' }); return; }
      const status = ['pending', 'approved', 'rejected'].includes(req.query?.status) ? req.query.status : null;
      const rows = await withDb(async c => (await c.query(
        status ? 'SELECT * FROM suggestions WHERE status=$1 ORDER BY created_at DESC LIMIT 200' : 'SELECT * FROM suggestions ORDER BY created_at DESC LIMIT 200',
        status ? [status] : []
      )).rows);
      send(res, 200, { total: rows.length, suggestions: rows });
      return;
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, e.code === 429 ? 429 : 500, { error: e.code === 429 ? e.message : 'Server error: ' + e.message });
  }
}
