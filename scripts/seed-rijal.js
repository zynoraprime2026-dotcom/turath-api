#!/usr/bin/env node
// Seed the Turath rijal table from the bundled ilm ar-rijal narrators
// (api/_rijal-data.js) via POST /api/rijal?seed=builtin.
// Idempotent: upserts by slug, so re-running refreshes/extends safely.
// Requires TURATH_ADMIN_PASS (and optionally TURATH_API_KEY; defaults
// to the public read key documented on the frontend Developers tab).

const BASE = process.env.TURATH_API_BASE || 'https://turath-api.vercel.app';
const KEY = process.env.TURATH_API_KEY || 'turath_b0e400ec9d4e0bd994761ec18dd65052';
const PASS = process.env.TURATH_ADMIN_PASS || '';

if (!PASS) {
  console.error('Set TURATH_ADMIN_PASS first (the curator passcode).');
  process.exit(1);
}

fetch(`${BASE}/api/rijal?seed=builtin`, {
  method: 'POST',
  headers: { 'x-api-key': KEY, 'x-admin-pass': PASS, 'Content-Type': 'application/json' },
  body: '{}'
}).then(async r => {
  console.log(r.status, JSON.stringify(await r.json(), null, 2));
  process.exit(r.ok ? 0 : 1);
}).catch(e => { console.error(e); process.exit(1); });
