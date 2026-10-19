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
    CREATE TABLE IF NOT EXISTS api_keys (
      key TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`);
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
  return { ...m, id: m.id, imageUrl: m.image_url || null, digitalUrl: m.digital_url || null, titleAr: m.title_ar || null, descriptionAr: m.description_ar || null, chain, sources: m.sources || null };
};
const mapE = e => ({ ...e, yearHijri: e.year_hijri, yearGregorian: e.year_gregorian, sourceUrl: e.source_url, titleAr: e.title_ar || null, descriptionAr: e.description_ar || null, sources: e.sources || null });

module.exports = { withDb, send, readBody, guard, mapM, mapE };
