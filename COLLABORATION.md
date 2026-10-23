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

## 2026-10-19 — Prime: Stories (Qasas) tab in the FRONTEND repo (turath)
- New "Stories" tab in turath (frontend) between History and About: The
  Beginning, the 25 Prophets, The End — bilingual timeline, modal reader
  with exact Arabic verses + sourced/graded hadith. Data from Ilm API
  GET /v1/stories (ilm-api repo, new stories route — no turath-api changes,
  so the 12-function cap is untouched).
- config.js now also carries ILM_API_BASE/ILM_API_KEY (client-visible read
  key, same free-tier stance as the turath key).
- sw.js cache bumped turath-v1 → turath-v2.
- Rebased onto eebdd86 (Read the full text link); both features verified
  together in a DOM test before push.

### Done — digital library upgrade (Agent B, ~06:20 UTC)
- DDL: manuscripts.read_url column added (one-time admin hook, removed after).
- API: readUrl now in mapM, PUT/POST mappings; m/[id].js share pages show
  "Read the full text" link.
- Data: 28 verified archive.org full-text edition links (read_url); scan link
  replacements: #49 Suwar al-Kawakib -> Gallica BnF Arabe 5036 (btv1b8432266z,
  browser-verified), #48 Nuzhat al-Mushtaq -> LoC 2021667394 (Bodleian viewer
  degraded as of 2026-10-19), #7 Shahnameh -> LoC 2012498868. #2 keeps Bodleian
  (noted outage in sources).
- Dedup: #12->#46, #16->#54, #33->#48, #36->#52, #37->#51 merged (sources/chain
  carried over) and deleted. Archive now 39 manuscripts, 14 with scan links,
  28 readable in-app.
- FRONTEND (turath repo): in-app archive.org reader (embed iframe, lazy),
  "Library" tab naming, hero copy "Islamic Manuscripts Digital Library",
  PWA cache v3.

### 2026-10-19 ~06:45 UTC — Agent B: new API features + folio images
- manuscripts.js: full-text q now covers title_ar/description_ar/subject/region/holding
  (Arabic search works); new filters centuryMin/centuryMax/readable/hasImage.
- manuscripts/[id].js GET: response now includes related[] (same subject/region, 4 max).
- Data: 15 public-domain folio images from Wikimedia Commons applied (all 4 Quran
  manuscripts, Istakhri, Zahrawi, Canon of Medicine, Qazwini, Muqaddimah, Akbarnama,
  Masnavi, Timbuktu, Siyer-i Nebi, Kashgari, Dalail). 22/47 records now have images.
- No new serverless functions (still 12/12). Verified live: Arabic q, readable=true
  (32), hasImage=true (22), related for #62 -> #64/#63/#65.

### 2026-10-21 ~09:45 UTC (Africa/Accra) — Ra One: search analytics, audio recitations, library timeline
- Audio recitations: `audio_url` column added (DDL in _lib.js); mapM/POST/PUT mappings expose
  `audioUrl`. `scripts/seed-audio.js` applies verified Wikimedia Commons recitations
  (Atcovi, 3× CC0 + 1× CC BY-SA 4.0) to the 4 Quran manuscripts (#62 Maryam, #63 Al-Qadr,
  #64 Ya-Sin, #65 Al-Kahf) with per-file credit appended to `sources`. Idempotent.
- Search analytics: new `search_logs` table; `manuscripts.js` GET logs non-empty `q`
  (query + result count, best-effort). `stats.js` now returns `searchesLast30d` +
  `topSearches` (top 10, 30-day window). No new serverless functions (still 12/12).
- FRONTEND (turath repo): "✦ Trending searches" chips on the Library tab (from
  /api/stats topSearches, ≥2 hits, tap to search); Grid ⇄ Timeline view toggle —
  timeline renders the whole archive grouped by AH century with ≈CE span, mini cards
  with thumbnails; audio player (preload=none) in the manuscript modal; admin form
  gains an Audio URL field; Developers tab documents audioUrl + topSearches.
  sw.js cache bumped v6 → v7. Verified in a jsdom boot test (no runtime errors).

### 2026-10-21 ~09:50 UTC (audit addendum) — Ra One: full deployment audit
- Audited live site + API end to end (endpoints, data, security, real-browser pass).
- All green: endpoints OK, audio exactly on the 4 Quran mss with credits, search
  logging works (incl. Arabic + zero-result queries), trending chips render live,
  timeline groups all 47 mss across 13 centuries, no passcode leaks in public repos.
- FIX: per-page cap was 50 and the timeline fetches the whole archive in one page —
  it would have silently truncated at 51 manuscripts. Raised the GET /api/manuscripts
  cap to 100 and the timeline fetch to per=100. Note: revisit if archive passes 100.

## Done — scholars of the archive (Ra One, 2026-10-23 ~06:55 UTC)
User request: add biographies of the scholars (Turath API).
- New endpoints: `GET /api/scholars (?q,field,region,page,per)`,
  `GET /api/scholars/:id` (numeric DB id or slug; includes
  `related_manuscripts` matched by author name, best-effort),
  `POST /api/scholars` (curator, upsert by slug),
  `POST /api/scholars?seed=builtin` (curator, imports the bundled bios).
- Routing stays inside the Hobby 12-function cap: handlers live in
  `api/index.js` behind `?__route=scholars`, exposed by vercel.json
  rewrites (`/api/scholars`, `/api/scholars/:id` -> `/api/index.js`).
  `api/_scholars-data.js` is underscore-prefixed = excluded from the
  function count, same as `_lib.js`.
- `api/_lib.js`: added `scholars` table (slug, bilingual name/full name,
  era, birth/death years, field, region, bio_en/bio_ar, works,
  source_url) + `mapS` mapper. Additive only; no existing routes touched.
- Content: 22 bilingual bios bundled in `api/_scholars-data.js` — the
  four imams, the six hadith compilers, at-Tabari, al-Khwarizmi, Ibn
  Sina, al-Biruni, al-Ghazali, al-Hariri, Ibn Rushd, an-Nawawi, Ibn
  Khaldun, Ibn Kathir, Ibn Hajar, al-Jazuli. GETs fall back to these
  while the table is empty, so the endpoint works immediately;
  `scripts/seed-scholars.js` (needs TURATH_ADMIN_PASS) persists them.
- Open idea: a Scholars tab in the frontend (turath repo) consuming
  these endpoints; not started there to avoid stepping on Agent B / Prime.
- 2026-10-23 (Ra One, audit follow-up): full API + frontend sweep (all 14
  endpoints, HTML share pages, CORS, auth, frontend Library/History/Developers
  tabs) — all passing. Fixed two issues in the new scholars code:
  (1) commit cc61124 wrote `ILIKE ${i}` instead of `ILIKE $${i}` -> invalid
  SQL silently zeroed related_manuscripts; fixed in d0dd082, re-verified live
  (Hariri->Maqamat, Ibn Sina->Canon, Khwarizmi->Jabr, Ibn Khaldun->Muqaddimah,
  Jazuli->Dalail). (2) clearer 404 on numeric /api/scholars/:id while the
  table is unseeded. Also added `match` aliases in _scholars-data.js.
