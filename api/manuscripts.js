const { withDb, send, readBody, guard, mapM } = require('./_lib');

// GET /api/manuscripts?q=&language=&subject=&region=&century=&page=
// POST /api/manuscripts {title, author, ...} (admin)
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    if (req.method === 'GET') {
      const q = req.query || {};
      const where = [];
      const params = [];
      if (q.q) { params.push('%' + q.q.toLowerCase() + '%'); where.push(`(LOWER(title) LIKE $${params.length} OR LOWER(title_ar) LIKE $${params.length} OR LOWER(author) LIKE $${params.length} OR LOWER(description) LIKE $${params.length} OR LOWER(description_ar) LIKE $${params.length} OR LOWER(subject) LIKE $${params.length} OR LOWER(region) LIKE $${params.length} OR LOWER(holding) LIKE $${params.length})`); }
      for (const f of ['language', 'subject', 'region', 'script']) {
        if (q[f]) { params.push(q[f]); where.push(`${f} = $${params.length}`); }
      }
      if (q.century) { params.push(parseInt(q.century) || 0); where.push(`century = $${params.length}`); }
      if (q.centuryMin) { params.push(parseInt(q.centuryMin) || 0); where.push(`century >= $${params.length}`); }
      if (q.centuryMax) { params.push(parseInt(q.centuryMax) || 0); where.push(`century <= $${params.length}`); }
      if (q.readable === 'true') where.push(`read_url <> ''`);
      if (q.hasImage === 'true') where.push(`image_url <> ''`);
      const wsql = where.length ? ' WHERE ' + where.join(' AND ') : '';
      const total = await withDb(async c => parseInt((await c.query('SELECT COUNT(*) AS n FROM manuscripts' + wsql, params)).rows[0].n));
      const page = Math.max(1, parseInt(q.page) || 1);
      const per = Math.min(50, Math.max(1, parseInt(q.per) || 12));
      params.push(per); params.push((page - 1) * per);
      const rows = await withDb(async c => (await c.query('SELECT * FROM manuscripts' + wsql + ` ORDER BY century NULLS LAST, title LIMIT $${params.length - 1} OFFSET $${params.length}`, params)).rows);
      const facets = await withDb(async c => ({
        languages: (await c.query("SELECT language, COUNT(*) n FROM manuscripts WHERE language <> '' GROUP BY language ORDER BY n DESC")).rows,
        subjects: (await c.query("SELECT subject, COUNT(*) n FROM manuscripts WHERE subject <> '' GROUP BY subject ORDER BY n DESC")).rows,
        regions: (await c.query("SELECT region, COUNT(*) n FROM manuscripts WHERE region <> '' GROUP BY region ORDER BY n DESC")).rows
      }));
      send(res, 200, { total, page, per, manuscripts: rows.map(mapM), facets });
      return;
    }
    if (req.method === 'POST') {
      const b = await readBody(req);
      const title = String(b.title || '').trim();
      if (!title) { send(res, 400, { error: 'title is required' }); return; }
      const row = await withDb(async c => (await c.query(
        `INSERT INTO manuscripts (title, title_ar, author, date_written, century, language, script, subject, region, holding, description, description_ar, chain, sources, digital_url, read_url, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
        [title.slice(0, 300), String(b.titleAr || '').slice(0, 300), String(b.author || '').slice(0, 200), String(b.dateWritten || '').slice(0, 100),
         parseInt(b.century) || null, String(b.language || '').slice(0, 60), String(b.script || '').slice(0, 60),
         String(b.subject || '').slice(0, 80), String(b.region || '').slice(0, 100), String(b.holding || '').slice(0, 200),
         String(b.description || '').slice(0, 4000), String(b.descriptionAr || '').slice(0, 4000),
         JSON.stringify(Array.isArray(b.chain) ? b.chain.slice(0, 20) : (b.chain ? [String(b.chain)] : [])),
         String(b.sources || '').slice(0, 2000),
         String(b.digitalUrl || '').slice(0, 500), String(b.readUrl || '').slice(0, 500), String(b.imageUrl || '').slice(0, 500)]
      )).rows[0]);
      send(res, 201, { ok: true, manuscript: mapM(row) });
      return;
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
