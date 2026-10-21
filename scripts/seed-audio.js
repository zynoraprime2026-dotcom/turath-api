#!/usr/bin/env node
// Seed audio recitations for the four Quran manuscripts in the archive.
// All four files verified live on Wikimedia Commons on 2026-10-21:
//   - license confirmed per file via the Commons imageinfo API
//   - three CC0, one CC BY-SA 4.0 (attribution kept in `sources` for every file)
// Pairings (deliberately neutral: the caption says "a recitation", it does NOT
// claim the recitation is the same passage as the surviving folios, except for
// the Birmingham manuscript whose folios are documented to contain Surahs 18-20).
// Idempotent: skips a manuscript that already has an audioUrl, and never
// appends the credit line twice.

const BASE = process.env.TURATH_API_BASE || 'https://turath-api.vercel.app';
const KEY = process.env.TURATH_API_KEY || 'turath_b0e400ec9d4e0bd994761ec18dd65052';
const PASS = process.env.TURATH_ADMIN_PASS || '';
const H = { 'x-api-key': KEY, 'Content-Type': 'application/json' };
const HA = { ...H, 'x-admin-pass': PASS };

// id -> [audioUrl, fileTitle, license, surah note (English)]
const AUDIO = {
  62: [
    'https://upload.wikimedia.org/wikipedia/commons/3/3a/Chapter_19%2C_Maryam_%28Murattal%29_-_Recitation_of_the_Holy_Qur%27an.mp3',
    "Chapter 19, Maryam (Murattal) - Recitation of the Holy Qur'an.mp3",
    'CC0',
    'Surah Maryam (ch. 19) — the Birmingham folios are documented to contain portions of Surahs 18-20'
  ],
  63: [
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/Chapter_97%2C_Al-Qadr_%28Murattal%29_-_Recitation_of_the_Holy_Qur%27an.mp3',
    "Chapter 97, Al-Qadr (Murattal) - Recitation of the Holy Qur'an.mp3",
    'CC BY-SA 4.0',
    'Surah Al-Qadr (ch. 97)'
  ],
  64: [
    'https://upload.wikimedia.org/wikipedia/commons/5/5b/Chapter_36%2C_Ya-Sin_%28Murattal%29_-_Recitation_of_the_Holy_Qur%27an.mp3',
    "Chapter 36, Ya-Sin (Murattal) - Recitation of the Holy Qur'an.mp3",
    'CC0',
    'Surah Ya-Sin (ch. 36)'
  ],
  65: [
    'https://upload.wikimedia.org/wikipedia/commons/2/2d/Chapter_18%2C_Al-Kahf_%28Murattal%29_-_Recitation_of_the_Holy_Qur%27an.mp3',
    "Chapter 18, Al-Kahf (Murattal) - Recitation of the Holy Qur'an.mp3",
    'CC0',
    'Surah Al-Kahf (ch. 18)'
  ]
};

(async () => {
  if (!PASS) { console.error('TURATH_ADMIN_PASS is required'); process.exit(1); }
  for (const [id, [url, file, lic, note]] of Object.entries(AUDIO)) {
    const r = await fetch(`${BASE}/api/manuscripts/${id}`, { headers: H });
    const d = await r.json();
    if (!r.ok) { console.error(`#${id}: fetch failed — ${d.error}`); continue; }
    const m = d.manuscript;
    if (m.audioUrl) { console.log(`#${id}: audio already set, skipped`); continue; }
    const credit = `Audio: ${note}; "${file}", Atcovi, ${lic}, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)})`;
    const sources = (m.sources || '').includes('Audio:') ? m.sources : [m.sources || '', credit].filter(Boolean).join(' | ');
    const pr = await fetch(`${BASE}/api/manuscripts/${id}`, {
      method: 'PUT', headers: HA,
      body: JSON.stringify({ audioUrl: url, sources: sources.slice(0, 2000) })
    });
    const pd = await pr.json();
    console.log(pr.ok ? `#${id}: audio set (${lic})` : `#${id}: PUT failed — ${pd.error}`);
  }
})();
