const { withDb, send, readBody, guard, mapS } = require('./_lib');
const { SCHOLARS } = require('./_scholars-data');

// GET /api — public service catalog.
// Scholars routes are mounted here via vercel.json rewrites:
//   /api/scholars     -> /api/index.js?__route=scholars
//   /api/scholars/:id -> /api/index.js?__route=scholars&__id=:id
// (keeps the deployment inside the Vercel Hobby 12-function cap;
//  _scholars-data.js is underscore-prefixed and excluded from the count.)
export default async function handler(req, res) {
  if (req.query && req.query.__route === 'scholars') return scholarsRoute(req, res);
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
        'GET /api/scholars (?q,field,region,page)', 'GET /api/scholars/:id',
        'POST /api/scholars (curator)', 'POST /api/scholars?seed=builtin (curator)',
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

// ---------- scholars ----------
async function scholarsRoute(req, res) {
  if (!guard(req, res)) return;
  try {
    const q = req.query || {};
    if (req.method === 'GET') {
      if (q.__id) return scholarDetail(q.__id, res);
      return scholarList(q, res);
    }
    if (req.method === 'POST') {
      if (q.seed === 'builtin') return seedBuiltin(res);
      return createScholar(req, res);
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}

async function dbScholars() {
  // true when the scholars table exists and holds at least one row
  try {
    const n = await withDb(async c => parseInt((await c.query('SELECT COUNT(*) AS n FROM scholars')).rows[0].n));
    return n > 0;
  } catch (e) { return false; }
}

const builtinRows = SCHOLARS.map((s, i) => ({ id: -(i + 1), ...s }));

function builtinList(q) {
  const term = (q.q || '').toLowerCase().trim();
  let rows = builtinRows;
  if (term) rows = rows.filter(s =>
    [s.nameEn, s.nameAr, s.fullName, s.works, s.field, s.region, s.bioEn, s.bioAr]
      .join(' ').toLowerCase().includes(term));
  if (q.field) rows = rows.filter(s => (s.field || '').toLowerCase() === String(q.field).toLowerCase());
  if (q.region) rows = rows.filter(s => (s.region || '').toLowerCase().includes(String(q.region).toLowerCase()));
  rows = rows.slice().sort((a, b) => (a.deathYear || 9999) - (b.deathYear || 9999));
  return rows;
}

async function scholarList(q, res) {
  const page = Math.max(1, parseInt(q.page) || 1);
  const per = Math.min(100, Math.max(1, parseInt(q.per) || 20));

  if (await dbScholars()) {
    const where = []; const params = [];
    if (q.q) {
      params.push('%' + q.q.toLowerCase() + '%');
      where.push(`(LOWER(name_en) LIKE $${params.length} OR LOWER(name_ar) LIKE $${params.length} OR LOWER(full_name) LIKE $${params.length} OR LOWER(works) LIKE $${params.length} OR LOWER(field) LIKE $${params.length} OR LOWER(bio_en) LIKE $${params.length} OR LOWER(bio_ar) LIKE $${params.length})`);
    }
    if (q.field) { params.push(q.field); where.push(`field = $${params.length}`); }
    if (q.region) { params.push('%' + q.region + '%'); where.push(`region LIKE $${params.length}`); }
    const wsql = where.length ? ' WHERE ' + where.join(' AND ') : '';
    // search analytics (best-effort)
    if (q.q) { const qs = String(q.q).trim().slice(0, 200); if (qs) { try { await withDb(async c => c.query('INSERT INTO search_logs (query, results) VALUES ($1, 0)', [qs])); } catch (e) {} } }
    const total = await withDb(async c => parseInt((await c.query('SELECT COUNT(*) AS n FROM scholars' + wsql, params)).rows[0].n));
    params.push(per); params.push((page - 1) * per);
    const rows = await withDb(async c => (await c.query('SELECT * FROM scholars' + wsql + ` ORDER BY death_year NULLS LAST, name_en LIMIT $${params.length - 1} OFFSET $${params.length}`, params)).rows);
    const facets = await withDb(async c => ({
      fields: (await c.query("SELECT field, COUNT(*) n FROM scholars WHERE field <> '' GROUP BY field ORDER BY n DESC")).rows,
      regions: (await c.query("SELECT region, COUNT(*) n FROM scholars WHERE region <> '' GROUP BY region ORDER BY n DESC")).rows
    }));
    send(res, 200, { total, page, per, scholars: rows.map(mapS), facets, source: 'db' });
    return;
  }

  // DB empty/unavailable — serve the bundled biographies
  const rows = builtinList(q);
  send(res, 200, { total: rows.length, page, per, scholars: rows.slice((page - 1) * per, (page - 1) * per + per),
    facets: { fields: [], regions: [] }, source: 'builtin' });
}

async function scholarDetail(id, res) {
  const key = String(id);
  let row = null;
  const numeric = /^\d+$/.test(key);
  try {
    row = await withDb(async c => (await c.query(
      numeric ? 'SELECT * FROM scholars WHERE id=$1' : 'SELECT * FROM scholars WHERE slug=$1', [numeric ? parseInt(key) : key]
    )).rows[0]);
  } catch (e) { row = null; }
  if (!row) row = builtinRows.find(s => s.slug === key) || null;
  if (!row) { send(res, 404, { error: 'Scholar not found' }); return; }

  const s = row.slug !== undefined && row.name_en ? mapS(row) : row; // db row -> camelCase; builtin already is

  // related manuscripts: authored works in the archive (best-effort)
  let related = [];
  try {
    related = await withDb(async c => (await c.query(
      `SELECT id, title, title_ar, author, century, image_url FROM manuscripts WHERE author ILIKE $1 OR author ILIKE $2 ORDER BY century NULLS LAST LIMIT 10`,
      ['%' + s.nameEn + '%', '%' + (s.nameAr || s.nameEn) + '%']
    )).rows);
  } catch (e) {}
  send(res, 200, { scholar: s, related_manuscripts: related });
}

const S_FIELDS = [
  ['nameEn', 'name_en'], ['nameAr', 'name_ar'], ['fullName', 'full_name'], ['era', 'era'],
  ['field', 'field'], ['region', 'region'], ['bioEn', 'bio_en'], ['bioAr', 'bio_ar'],
  ['works', 'works'], ['sourceUrl', 'source_url']
];

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

async function upsertScholar(b) {
  const nameEn = String(b.nameEn || b.name || '').trim();
  if (!nameEn) { const e = new Error('nameEn is required'); e.status = 400; throw e; }
  const slug = String(b.slug || slugify(nameEn)).slice(0, 80);
  const vals = [slug, nameEn.slice(0, 200)];
  const cols = ['slug', 'name_en'];
  for (const [k, col] of S_FIELDS.slice(1)) {
    if (b[k] !== undefined) { cols.push(col); vals.push(String(b[k]).slice(0, 4000)); }
  }
  cols.push('birth_year'); vals.push(parseInt(b.birthYear) || null);
  cols.push('death_year'); vals.push(parseInt(b.deathYear) || null);
  const ph = cols.map((_, i) => `$${i + 1}`).join(', ');
  const sets = cols.slice(1).map((c, i) => `${c} = $${i + 2}`).join(', ');
  return await withDb(async c => (await c.query(
    `INSERT INTO scholars (${cols.join(', ')}) VALUES (${ph}) ON CONFLICT (slug) DO UPDATE SET ${sets} RETURNING *`, vals
  )).rows[0]);
}

async function createScholar(req, res) {
  try {
    const b = await readBody(req);
    const row = await upsertScholar(b);
    send(res, 201, { ok: true, scholar: mapS(row) });
  } catch (e) {
    send(res, e.status || 500, { error: e.status ? e.message : 'Server error: ' + e.message });
  }
}

async function seedBuiltin(res) {
  try {
    let n = 0;
    for (const s of SCHOLARS) { await upsertScholar(s); n++; }
    send(res, 200, { ok: true, seeded: n, note: 'Bundled scholar biographies imported into the scholars table (upsert by slug).' });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
