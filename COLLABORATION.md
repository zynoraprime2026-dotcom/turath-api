# Turath — Agent Collaboration Log

Shared coordination file for parallel agents working on this project.
Before editing: `git pull --rebase origin main`. Keep changes additive where possible.
When you start a work area or finish one, append a dated entry below.

## Coordination rules
1. Pull before you build, pull before you push. Never force-push.
2. Keep edits surgical — other agents may have pending changes in app.js/index.html.
3. Log what you touched (files + feature) so we don't duplicate work.
4. Vercel Hobby plan: max 12 serverless functions in api/ (excluding _lib.js). We are at 11.
   Consolidate routes before adding new function files.

## Status (2026-10-19, 01:35 UTC)

Live: turath-green.vercel.app (frontend) + turath-api.vercel.app (API)

### Done — share & social (Prime)
- `api/m/[id].js` — public server-rendered manuscript pages with OG/Twitter meta
  (no auth; frontend rewrite `/m/:id` -> `turath-api.vercel.app/api/m/:id`).
- `api/manuscripts/daily.js` — deterministic Manuscript of the Day (UTC day cycle).
- Frontend: OG meta tags on index.html; deep links `#m/<id>` (open manuscript,
  modal syncs URL); Share button in modal (native share + clipboard fallback);
  Manuscript of the Day card (`#dailyBox`) on the manuscripts tab.
- Fixed: `curM` was never assigned — citation/export and image-upload buttons
  were silently no-op before.

### Done — admin & content (Agent B)
- Random manuscript, citation export, visitor suggestions with admin approval,
  image upload via Vercel Blob, century-divided timeline, bilingual EN/AR data,
  endpoint consolidation to fit the Hobby 12-function cap.

### Pending / ideas
- Scan links: `scripts/seed-scan-links.js` has 3 verified links (Bodleian
  al-Khwarizmi, QDL Canon, NYPL Dalail al-Khayrat). Needs TURATH_ADMIN_PASS to
  run, or apply via admin PUT. More can be added to the LINKS map as they are
  verified — only institutional/library pages, verified HTTP 200.
- Manuscript images (Vercel Blob upload exists; none uploaded yet).
- Event detail pages / OG, same pattern as manuscripts if desired.

## Log
- 2026-10-19 01:40 UTC (Prime): frontend had empty grids + dead deep links in
  production; root cause was the openSugg ReferenceError (Agent B fixed it in
  bfb72f3 — init crashed before loadM/loadE/loadDaily). Prime added visible
  API-error surfacing as a safety net (front commit "Surface API errors...").
  All verified working after redeploy. Reminder to both agents: prefer
  `window.xxx = fn` global assignment pattern before addEventListener usage.

### Done — developer API docs (Agent B, 02:35 UTC)
- Frontend: new "Developers" tab (nav `data-tab="devs"`, section `#tab-devs`)
  with full public API documentation — auth, endpoints table, manuscript field
  reference, curl/fetch examples, rate limits, CC BY attribution.
- `api/index.js`: refreshed endpoint catalog + `docs` link to the frontend.
- Fixed frontend blank-grid: `openSugg` typo in suggest button listener crashed
  init before loadM() ran. Fixed: `openSugg` -> `openSuggest`.
- Note: public read key turath_b0e400ec… is intentionally public (docs page +
  config.js). x-admin-pass stays curator-only, never in frontend code.

### Done — batch 2 content + platform (Agent B, 05:30 UTC)
- Content: 18 new manuscripts (ids 44–61) via scripts/seed-batch2.js — Maqamat,
  Kalila wa Dimna, Muqaddimah, Rihla, Tabula Rogeriana, Suwar al-Kawakib,
  Tasrif, Baburnama, Masnavi, Khamsa Nizami, Tarikh al-Sudan, Tarikh al-Fattash,
  Nayl al-Ibtihaj, Tedzkirat al-Nisyan, Nur al-Albab (Nana Asma'u), Ajaib
  al-Makhluqat, Muwatta, Aghani. Verified digitalUrls (Gallica, Digital
  Bodleian, LoC, Google Arts & Culture). Archive now 44 manuscripts.
- Images: 7 public-domain/CC0 folio images uploaded to Vercel Blob for ids
  7, 44, 45, 48, 49, 51, 53 (source credit appended to each record's sources).
- Event share pages: NEW api/e/[id].js (public, OG meta; frontend rewrite
  /e/:id) — this is the 12th and FINAL serverless function on the Hobby cap.
- PWA: manifest.webmanifest, sw.js offline shell, icons in the frontend.
- Backups: scripts/backup.js + weekly scheduled agent run (Mon 05:30 Accra);
  backups/backup-YYYY-MM-DD.json gets committed here weekly.
