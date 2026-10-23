#!/usr/bin/env node
// Seed the Turath scholars table from the bundled biographies
// (api/_scholars-data.js) via POST /api/scholars?seed=builtin.
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

fetch(`${BASE}/api/scholars?seed=builtin`, {
  method: 'POST',
  headers: { 'x-api-key': KEY, 'x-admin-pass': PASS, 'Content-Type': 'application/json' },
  body: '{}'
})
  .then(r => r.json())
  .then(j => {
    if (j.error) { console.error('Seed failed:', j.error); process.exit(1); }
    console.log(`Seeded ${j.seeded} scholars into ${BASE}.`);
  })
  .catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
