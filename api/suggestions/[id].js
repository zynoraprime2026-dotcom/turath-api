const { withDb, send, readBody, guard } = require('../_lib');

// PUT /api/suggestions/:id (admin) — review a suggestion; approving copies it into the manuscripts table
// DELETE /api/suggestions/:id (admin)
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    const id = parseInt(req.query.id);
    if (!id) { send(res, 400, { error: 'Invalid id' }); return; }
    if (req.method === 'PUT') {
      const b = await readBody(req);
      const cur = await withDb(async c => (await c.query('SELECT * FROM suggestions WHERE id=$1', [id])).rows[0]);
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
        await withDb(async c => c.query('UPDATE suggestions SET status=$1, description=$2 WHERE id=$3', ['approved', m.description, id]));
        send(res, 200, { ok: true, status: 'approved', manuscriptId: newId, manuscript: m });
        return;
      }
      await withDb(async c => c.query('UPDATE suggestions SET status=$1 WHERE id=$2', [status, id]));
      send(res, 200, { ok: true, status });
      return;
    }
    if (req.method === 'DELETE') {
      const r = await withDb(async c => (await c.query('DELETE FROM suggestions WHERE id=$1', [id])).rowCount);
      if (!r) { send(res, 404, { error: 'Suggestion not found' }); return; }
      send(res, 200, { ok: true, deleted: r });
      return;
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) { send(res, 500, { error: 'Server error: ' + e.message }); }
}
