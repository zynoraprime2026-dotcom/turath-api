const { withDb, send, readBody, guard, mapS, mapR } = require('./_lib');
const { SCHOLARS } = require('./_scholars-data');
const { RIJAL, GRADES, TERMS } = require('./_rijal-data');

// GET /api — public service catalog.
// Scholars and rijal routes are mounted here via vercel.json rewrites:
//   /api/scholars     -> /api/index.js?__route=scholars
//   /api/scholars/:id -> /api/index.js?__route=scholars&__id=:id
//   /api/rijal        -> /api/index.js?__route=rijal
//   /api/rijal/:id    -> /api/index.js?__route=rijal&__id=:id
// (keeps the deployment inside the Vercel Hobby 12-function cap;
//  _scholars-data.js is underscore-prefixed and excluded from the count.)
export default async function handler(req, res) {
  if (req.query && req.query.__route === 'scholars') return scholarsRoute(req, res);
  if (req.query && req.query.__route === 'rijal') return rijalRoute(req, res);
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
        'GET /api/rijal (?q,grade,generation,region,page)', 'GET /api/rijal/:id',
        'POST /api/rijal (curator)', 'POST /api/rijal?seed=builtin (curator)',
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
  if (!row) {
    send(res, 404, { error: numeric
      ? 'Scholar not found. Numeric ids are available once the scholars table is seeded; until then use slug lookup (e.g. /api/scholars/bukhari).'
      : 'Scholar not found' });
    return;
  }

  const s = row.slug !== undefined && row.name_en ? mapS(row) : row; // db row -> camelCase; builtin already is

  // related manuscripts: authored works in the archive (best-effort).
  // match terms: English name, Arabic name, plus explicit aliases (s.match)
  let related = [];
  try {
    const n = String(s.nameEn || '');
    const derived = [];
    for (const part of n.split(' (')) { // "Ibn Sina (Avicenna)" -> "Ibn Sina", "Avicenna)"
      for (const seg of part.replace(')', '').split(/ of |, /)) if (seg.trim().length >= 4) derived.push(seg.trim());
    }
    const terms = [...new Set([n, s.nameAr, ...(s.match || []), ...derived].filter(Boolean))];
    const conds = terms.map((_, i) => `author ILIKE $${i + 1}`).join(' OR ');
    related = await withDb(async c => (await c.query(
      `SELECT id, title, title_ar, author, century, image_url FROM manuscripts WHERE ${conds} ORDER BY century NULLS LAST LIMIT 10`,
      terms.map(t => '%' + t + '%')
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

// ---------- rijal (ilm ar-rijal narrators) ----------
async function rijalRoute(req, res) {
  if (!guard(req, res)) return;
  try {
    const q = req.query || {};
    if (req.method === 'GET') {
      if (q.__id) return rijalDetail(q.__id, res);
      return rijalList(q, res);
    }
    if (req.method === 'POST') {
      if (q.seed === 'builtin') return seedRijal(res);
      return createNarrator(req, res);
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}

async function dbRijal() {
  // true when the rijal table exists and holds at least one row
  try {
    const n = await withDb(async c => parseInt((await c.query('SELECT COUNT(*) AS n FROM rijal')).rows[0].n));
    return n > 0;
  } catch (e) { return false; }
}

const builtinNarrators = RIJAL.map((r, i) => ({ id: -(i + 1), ...r }));

function builtinNarratorList(q) {
  const term = (q.q || '').toLowerCase().trim();
  let rows = builtinNarrators;
  if (term) rows = rows.filter(r =>
    [r.nameEn, r.nameAr, r.fullName, r.region, r.bioEn, r.bioAr,
     (r.teachers || []).join(' '), (r.students || []).join(' ')]
      .join(' ').toLowerCase().includes(term));
  if (q.grade) rows = rows.filter(r => (r.grade || {}).code === String(q.grade));
  if (q.generation) rows = rows.filter(r => (r.generation || '') === String(q.generation));
  if (q.region) rows = rows.filter(r => (r.region || '').toLowerCase().includes(String(q.region).toLowerCase()));
  rows = rows.slice().sort((a, b) => (a.deathYear || 9999) - (b.deathYear || 9999));
  return rows;
}

function gradeFacets(rows) {
  const tally = {};
  for (const r of rows) {
    const c = (r.grade || {}).code || 'other';
    tally[c] = (tally[c] || 0) + 1;
  }
  return GRADES.map(g => ({ code: g.code, en: g.en, ar: g.ar, rank: g.rank, n: tally[g.code] || 0 }));
}

async function rijalList(q, res) {
  const page = Math.max(1, parseInt(q.page) || 1);
  const per = Math.min(100, Math.max(1, parseInt(q.per) || 20));

  if (await dbRijal()) {
    const where = []; const params = [];
    if (q.q) {
      params.push('%' + q.q.toLowerCase() + '%');
      where.push(`(LOWER(name_en) LIKE $${params.length} OR LOWER(name_ar) LIKE $${params.length} OR LOWER(full_name) LIKE $${params.length} OR LOWER(region) LIKE $${params.length} OR LOWER(bio_en) LIKE $${params.length} OR LOWER(bio_ar) LIKE $${params.length} OR LOWER(teachers) LIKE $${params.length} OR LOWER(students) LIKE $${params.length})`);
    }
    if (q.grade) { params.push(q.grade); where.push(`grade_code = $${params.length}`); }
    if (q.generation) { params.push(q.generation); where.push(`generation = $${params.length}`); }
    if (q.region) { params.push('%' + q.region + '%'); where.push(`region LIKE $${params.length}`); }
    const wsql = where.length ? ' WHERE ' + where.join(' AND ') : '';
    if (q.q) { const qs = String(q.q).trim().slice(0, 200); if (qs) { try { await withDb(async c => c.query('INSERT INTO search_logs (query, results) VALUES ($1, 0)', [qs])); } catch (e) {} } } // search analytics (best-effort)
    const total = await withDb(async c => parseInt((await c.query('SELECT COUNT(*) AS n FROM rijal' + wsql, params)).rows[0].n));
    params.push(per); params.push((page - 1) * per);
    const rows = await withDb(async c => (await c.query('SELECT * FROM rijal' + wsql + ` ORDER BY death_year NULLS LAST, name_en LIMIT $${params.length - 1} OFFSET $${params.length}`, params)).rows);
    const facets = await withDb(async c => ({
      grades: (await c.query('SELECT grade_code, COUNT(*) n FROM rijal WHERE grade_code <> \'\' GROUP BY grade_code')).rows,
      generations: (await c.query('SELECT generation, COUNT(*) n FROM rijal WHERE generation <> \'\' GROUP BY generation ORDER BY n DESC')).rows
    }));
    send(res, 200, { total, page, per, rijal: rows.map(mapR), facets, glossary: { grades: GRADES, terms: TERMS }, source: 'db' });
    return;
  }

  // DB empty/unavailable — serve the bundled narrators
  const rows = builtinNarratorList(q);
  const gens = {};
  for (const r of builtinNarrators) gens[r.generation] = (gens[r.generation] || 0) + 1;
  send(res, 200, { total: rows.length, page, per,
    rijal: rows.slice((page - 1) * per, (page - 1) * per + per),
    facets: { grades: gradeFacets(builtinNarrators).filter(g => g.n > 0),
      generations: Object.keys(gens).map(g => ({ generation: g, n: gens[g] })) },
    glossary: { grades: GRADES, terms: TERMS }, source: 'builtin' });
}

function findNarrator(key) {
  const k = String(key);
  const numeric = /^\d+$/.test(k);
  // builtin lookup by slug
  return { key: k, numeric, builtin: builtinNarrators.find(r => r.slug === k) || null };
}

async function rijalDetail(id, res) {
  const { key, numeric, builtin } = findNarrator(id);
  let row = null;
  try {
    row = await withDb(async c => (await c.query(
      numeric ? 'SELECT * FROM rijal WHERE id=$1' : 'SELECT * FROM rijal WHERE slug=$1', [numeric ? parseInt(key) : key]
    )).rows[0]);
  } catch (e) { row = null; }
  if (!row) row = builtin;
  if (!row) {
    send(res, 404, { error: numeric
      ? 'Narrator not found. Numeric ids are available once the rijal table is seeded; until then use slug lookup (e.g. /api/rijal/nafi-mawla-ibn-umar).'
      : 'Narrator not found' });
    return;
  }

  const r = row.name_en ? mapR(row) : row; // db row -> camelCase; builtin already is

  // best-effort: is this narrator also in the scholars of the archive?
  let scholar = null;
  try {
    const short = String(r.nameEn || '').replace(/^Imam\s+/, '');
    scholar = await withDb(async c => (await c.query(
      'SELECT slug, name_en, name_ar FROM scholars WHERE name_en ILIKE $1 LIMIT 1', ['%' + short.split(' (')[0] + '%']
    )).rows[0]) || null;
  } catch (e) {}
  if (!scholar) {
    const short = String(r.nameEn || '').replace(/^Imam\s+/, '').split(' (')[0];
    const s = SCHOLARS.find(x => String(x.nameEn || '').includes(short));
    if (s) scholar = { slug: s.slug, name_en: s.nameEn, name_ar: s.nameAr };
  }
  if (scholar && scholar.slug === r.slug) scholar = null; // shouldn't happen, but guard

  send(res, 200, { narrator: r, related_scholar: scholar, glossary: { grades: GRADES, terms: TERMS } });
}

const R_FIELDS = [
  ['nameAr', 'name_ar'], ['fullName', 'full_name'], ['generation', 'generation'],
  ['region', 'region'], ['bioEn', 'bio_en'], ['bioAr', 'bio_ar'], ['source', 'source']
];

async function upsertNarrator(b) {
  const nameEn = String(b.nameEn || b.name || '').trim();
  if (!nameEn) { const e = new Error('nameEn is required'); e.status = 400; throw e; }
  const slug = String(b.slug || slugify(nameEn)).slice(0, 80);
  const g = b.grade || {};
  const vals = [slug, nameEn.slice(0, 200)];
  const cols = ['slug', 'name_en'];
  for (const [k, col] of R_FIELDS) {
    if (b[k] !== undefined) { cols.push(col); vals.push(String(b[k]).slice(0, 4000)); }
  }
  cols.push('grade_code'); vals.push(String(g.code || b.gradeCode || '').slice(0, 40));
  cols.push('grade_en'); vals.push(String(g.en || b.gradeEn || '').slice(0, 200));
  cols.push('grade_ar'); vals.push(String(g.ar || b.gradeAr || '').slice(0, 200));
  cols.push('death_year'); vals.push(parseInt(b.deathYear) || null);
  cols.push('teachers'); vals.push(JSON.stringify(Array.isArray(b.teachers) ? b.teachers : []));
  cols.push('students'); vals.push(JSON.stringify(Array.isArray(b.students) ? b.students : []));
  const ph = cols.map((_, i) => `$${i + 1}`).join(', ');
  const sets = cols.slice(1).map((c, i) => `${c} = $${i + 2}`).join(', ');
  return await withDb(async c => (await c.query(
    `INSERT INTO rijal (${cols.join(', ')}) VALUES (${ph}) ON CONFLICT (slug) DO UPDATE SET ${sets} RETURNING *`, vals
  )).rows[0]);
}

async function createNarrator(req, res) {
  try {
    const b = await readBody(req);
    const row = await upsertNarrator(b);
    send(res, 201, { ok: true, narrator: mapR(row) });
  } catch (e) {
    send(res, e.status || 500, { error: e.status ? e.message : 'Server error: ' + e.message });
  }
}

async function seedRijal(res) {
  try {
    let n = 0;
    for (const r of RIJAL) { await upsertNarrator(r); n++; }
    send(res, 200, { ok: true, seeded: n, note: 'Bundled ilm ar-rijal narrators imported into the rijal table (upsert by slug).' });
  } catch (e) {
    send(res, 500, { error: 'Server error: ' + e.message });
  }
}
