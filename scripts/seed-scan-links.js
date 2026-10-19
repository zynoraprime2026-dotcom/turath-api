#!/usr/bin/env node
// Seed verified "View digitized copy" links into Turath manuscripts.
// Usage:  TURATH_ADMIN_PASS=<passcode> node scripts/seed-scan-links.js
// Idempotent: skips links already set, never overwrites existing values.
//
// All URLs verified live (HTTP 200 / known-good institutional pages) on 2026-10-19.
// The linked copies are historic digitized manuscripts of the same work
// (institution may differ from the physical holding recorded in `holding`).

const BASE = process.env.TURATH_API_BASE || 'https://turath-api.vercel.app';
const KEY = process.env.TURATH_API_KEY || 'turath_b0e400ec9d4e0bd994761ec18dd65052';
const PASS = process.env.TURATH_ADMIN_PASS || '';
if (!PASS) { console.error('Set TURATH_ADMIN_PASS (the x-admin-pass value)'); process.exit(1); }

// manuscript id -> verified digitized copy URL
const LINKS = {
  2:  'https://digital.bodleian.ox.ac.uk/objects/279c00b0-6f7e-49a1-ab39-9d6296260a18/', // al-Khwarizmi, Algebra — Bodleian MS. Huntington 214
  6:  'https://www.qdl.qa/en/archive/81055/vdc_100052704276.0x00005c',                   // Ibn Sina, Canon of Medicine — 13th-c. copy (Qatar Digital Library / British Library)
  14: 'https://digitalcollections.nypl.org/items/f9c47890-027d-0139-b7a3-0242ac110003',   // al-Jazuli, Dalail al-Khayrat — NYPL Oriental Manuscripts
};

(async () => {
  for (const [id, url] of Object.entries(LINKS)) {
    const cur = await fetch(`${BASE}/api/manuscripts/${id}`, { headers: { 'x-api-key': KEY } });
    const d = await cur.json();
    if (!cur.ok) { console.log(`#${id}: ${d.error}`); continue; }
    const m = d.manuscript;
    if (m.digitalUrl) { console.log(`#${id} ${m.title}: already has digitalUrl, skipping`); continue; }
    const r = await fetch(`${BASE}/api/manuscripts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'x-admin-pass': PASS },
      body: JSON.stringify({ digitalUrl: url })
    });
    const out = await r.json();
    console.log(`#${id} ${m.title}: ${r.ok ? 'linked ✓' : (out.error || 'failed')} -> ${url}`);
  }
})();
