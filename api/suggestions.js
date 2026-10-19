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
    const sid = req.query && req.query.id ? parseInt(req.query.id) : null;
    if ((req.method === 'PUT' || req.method === 'DELETE') && sid) {
      if (!isAdmin) { send(res, 401, { error: 'Invalid or missing x-admin-pass' }); return; }
      if (req.method === 'DELETE') {
        const r = await withDb(async c => (await c.query('DELETE FROM suggestions WHERE id=$1', [sid])).rowCount);
        if (!r) { send(res, 404, { error: 'Suggestion not found' }); return; }
        send(res, 200, { ok: true, deleted: r });
        return;
      }
      const b = await readBody(req);
      const cur = await withDb(async c => (await c.query('SELECT * FROM suggestions WHERE id=$1', [sid])).rows[0]);
      if (!cur) { send(res, 404, { error: 'Suggestion not found' }); return; }
      const status = ['pending', 'approved', 'rejected'].includes(b.status) ? b.status : cur.status;
      const fields = {};
      for (const k of ['title', 'author', 'language', 'subject', 'region', 'description']) {
        if (typeof b[k] === 'string' && b[k].trim()) fields[k] = b[k].trim().slice(0, 1000);
      }
      if (status === 'approved') {
        const m = {
          title: fields.title || cur.title,
          author: fields.author || cur.author,
          language: fields.language || cur.language,
          subject: fields.subject || cur.subject,
          region: fields.region || cur.region,
          description: fields.description || cur.description
        };
        const newId = await withDb(async c => (await c.query(
          'INSERT INTO manuscripts (title, author, language, subject, region, description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
          [m.title, m.author, m.language, m.subject, m.region, m.description]
        )).rows[0].id);
        await withDb(async c => c.query('UPDATE suggestions SET status=$1 WHERE id=$2', ['approved', sid]));
        send(res, 200, { ok: true, status: 'approved', manuscriptId: newId, manuscript: m });
        return;
      }
      await withDb(async c => c.query('UPDATE suggestions SET status=$1 WHERE id=$2', [status, sid]));
      send(res, 200, { ok: true, status });
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
