#!/usr/bin/env node
// Turath weekly database backup: exports all manuscripts + events via the
// public API and writes backups/backup-YYYY-MM-DD.json.
// The scheduled agent run commits and pushes the result to GitHub.
//
// Usage:  node scripts/backup.js            (writes file, prints path)
//         TURATH_ADMIN_PASS=... node scripts/backup.js   (also includes suggestions)

const BASE = process.env.TURATH_API_BASE || 'https://turath-api.vercel.app';
const KEY = process.env.TURATH_API_KEY || 'turath_b0e400ec9d4e0bd994761ec18dd65052';
const PASS = process.env.TURATH_ADMIN_PASS || '';

async function pageAll(path) {
  const out = []; let page = 1;
  for (;;) {
    const r = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}page=${page}`, { headers: { 'x-api-key': KEY } });
    const d = await r.json();
    if (!r.ok) throw new Error(`${path} page ${page}: ${d.error || 'HTTP ' + r.status}`);
    out.push(...(d.manuscripts || d.events || []));
    if (out.length >= d.total) return { total: d.total, records: out };
    page++;
  }
}

(async () => {
  const manuscripts = await pageAll('/api/manuscripts?region=');
  const events = await pageAll('/api/events?region=');
  const backup = {
    generated_at: new Date().toISOString(),
    source: BASE,
    counts: { manuscripts: manuscripts.total, events: events.total },
    manuscripts: manuscripts.records,
    events: events.records
  };
  if (PASS) {
    const r = await fetch(`${BASE}/api/suggestions`, { headers: { 'x-api-key': KEY, 'x-admin-pass': PASS } });
    if (r.ok) { const d = await r.json(); if (Array.isArray(d.suggestions)) backup.suggestions = d.suggestions; }
  }
  const path = `backups/backup-${new Date().toISOString().slice(0, 10)}.json`;
  require('fs').mkdirSync('backups', { recursive: true });
  require('fs').writeFileSync(path, JSON.stringify(backup, null, 1));
  console.log(`${path}: ${backup.counts.manuscripts} manuscripts, ${backup.counts.events} events${backup.suggestions ? ', ' + backup.suggestions.length + ' suggestions' : ''}`);
})().catch(e => { console.error('BACKUP FAILED:', e.message); process.exit(1); });
