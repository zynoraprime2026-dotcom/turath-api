const { Client } = require('pg');

// ---------- db ----------
let schemaReady = null;
async function withDb(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await c.connect();
    await c.query(`CREATE TABLE IF NOT EXISTS manuscripts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT DEFAULT '',
      date_written TEXT DEFAULT '',
      century INT,
      language TEXT DEFAULT '',
      script TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      region TEXT DEFAULT '',
      holding TEXT DEFAULT '',
      description TEXT DEFAULT '',
      digital_url TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS historical_events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      year_hijri INT,
      year_gregorian INT,
      category TEXT DEFAULT '',
      region TEXT DEFAULT '',
      description TEXT DEFAULT '',
      source_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS title_ar TEXT DEFAULT '';
    ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS description_ar TEXT DEFAULT '';
    ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT '[]';
    ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS sources TEXT DEFAULT '';
    ALTER TABLE historical_events ADD COLUMN IF NOT EXISTS title_ar TEXT DEFAULT '';
    ALTER TABLE historical_events ADD COLUMN IF NOT EXISTS description_ar TEXT DEFAULT '';
    ALTER TABLE historical_events ADD COLUMN IF NOT EXISTS sources TEXT DEFAULT '';
    CREATE TABLE IF NOT EXISTS suggestions (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT DEFAULT '',
      language TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      region TEXT DEFAULT '',
      description TEXT DEFAULT '',
      submitter TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS api_keys (
      key TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS search_logs (
      id SERIAL PRIMARY KEY,
      query TEXT NOT NULL,
      results INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS scholars (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE,
      name_en TEXT NOT NULL,
      name_ar TEXT DEFAULT '',
      full_name TEXT DEFAULT '',
      era TEXT DEFAULT '',
      birth_year INT,
      death_year INT,
      field TEXT DEFAULT '',
      region TEXT DEFAULT '',
      bio_en TEXT DEFAULT '',
      bio_ar TEXT DEFAULT '',
      works TEXT DEFAULT '',
      source_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS rijal (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE,
      name_en TEXT NOT NULL,
      name_ar TEXT DEFAULT '',
      full_name TEXT DEFAULT '',
      generation TEXT DEFAULT '',
      death_year INT,
      grade_code TEXT DEFAULT '',
      grade_en TEXT DEFAULT '',
      grade_ar TEXT DEFAULT '',
      teachers TEXT DEFAULT '[]',
      students TEXT DEFAULT '[]',
      region TEXT DEFAULT '',
      bio_en TEXT DEFAULT '',
      bio_ar TEXT DEFAULT '',
      source TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS audio_url TEXT DEFAULT '';`);
    return await fn(c);
  } finally { try { await c.end(); } catch (e) {} }
}

// ---------- helpers ----------
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,x-api-key,x-admin-pass'
};
function send(res, code, body) {
  res.writeHead(code, { ...CORS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}
const readBody = req => new Promise(ok => {
  let b = ''; req.on('data', d => b += d); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { ok({}); } });
});

// rate limit: 300 reads/hour per key
const hits = new Map();
function rateOk(k) {
  const now = Date.now(); const rec = hits.get(k) || { n: 0, t: now };
  if (now - rec.t > 3600e3) { rec.n = 0; rec.t = now; }
  rec.n++; hits.set(k, rec);
  return rec.n <= 300;
}

function guard(req, res) {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return false; }
  const key = req.headers['x-api-key'] || '';
  const valid = (process.env.API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!key || !valid.includes(key)) { send(res, 401, { error: 'Invalid or missing x-api-key' }); return false; }
  if (!rateOk(key)) { send(res, 429, { error: 'Rate limit exceeded (300/hour)' }); return false; }
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const pass = req.headers['x-admin-pass'] || '';
    if (!pass || pass !== (process.env.ADMIN_PASSCODE || '')) { send(res, 401, { error: 'Invalid or missing x-admin-pass' }); return false; }
  }
  return true;
}

const mapM = m => {
  let chain = [];
  try { chain = JSON.parse(m.chain || '[]'); } catch (e) {}
  return { ...m, id: m.id, imageUrl: m.image_url || null, digitalUrl: m.digital_url || null, readUrl: m.read_url || null, audioUrl: m.audio_url || null, titleAr: m.title_ar || null, descriptionAr: m.description_ar || null, chain, sources: m.sources || null };
};
const mapE = e => ({ ...e, yearHijri: e.year_hijri, yearGregorian: e.year_gregorian, sourceUrl: e.source_url, titleAr: e.title_ar || null, descriptionAr: e.description_ar || null, sources: e.sources || null });

// scholars table uses the same row -> camelCase convention
const mapS = s => ({ ...s, slug: s.slug || null, nameEn: s.name_en, nameAr: s.name_ar || null, fullName: s.full_name || null, birthYear: s.birth_year || null, deathYear: s.death_year || null, bioEn: s.bio_en || null, bioAr: s.bio_ar || null, works: s.works || null, sourceUrl: s.source_url || null });

// rijal (ilm ar-rijal narrators) row -> camelCase
const mapR = r => {
  let teachers = [], students = [];
  try { teachers = JSON.parse(r.teachers || '[]'); } catch (e) {}
  try { students = JSON.parse(r.students || '[]'); } catch (e) {}
  return { ...r, nameEn: r.name_en, nameAr: r.name_ar || null, fullName: r.full_name || null,
    generation: r.generation || null, deathYear: r.death_year || null,
    grade: { code: r.grade_code || null, en: r.grade_en || null, ar: r.grade_ar || null },
    teachers, students, region: r.region || null, bioEn: r.bio_en || null, bioAr: r.bio_ar || null, source: r.source || null };
};

module.exports = { withDb, send, readBody, guard, mapM, mapE, mapS, mapR };
