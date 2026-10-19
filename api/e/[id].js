const { withDb, send } = require('../../_lib');

// GET /api/e/:id — PUBLIC server-rendered event page (no API key needed).
// Shareable URLs + OpenGraph previews via frontend rewrite:
// turath-green.vercel.app/e/:id -> turath-api.vercel.app/api/e/:id
export default async function handler(req, res) {
  try {
    const id = parseInt(req.query.id);
    if (!id) { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(page404()); return; }
    const e = await withDb(async c => (await c.query('SELECT * FROM historical_events WHERE id=$1', [id])).rows[0]);
    if (!e) { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(page404()); return; }

    const SITE = 'https://turath-green.vercel.app';
    const pageUrl = `${SITE}/e/${id}`;
    const when = (e.year_gregorian ? e.year_gregorian + ' CE' : '') + (e.year_hijri ? (e.year_gregorian ? ' / ' : '') + e.year_hijri + ' AH' : '');
    const title = e.title + (e.title_ar ? ' · ' + e.title_ar : '');
    const desc = (e.description || 'An event in Islamic history from the Turath timeline.').slice(0, 220);
    const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const meta = [['category', e.category], ['region', e.region]].filter(([, v]) => v);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Turath</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${pageUrl}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Turath — Islamic Manuscripts & History">
<meta property="og:title" content="${esc(e.title)}${e.title_ar ? ' · ' + esc(e.title_ar) : ''}">
<meta property="og:description" content="${esc(desc)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(e.title)}">
<meta name="twitter:description" content="${esc(desc)}">
<style>
body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#0F2620;color:#F3ECDA;line-height:1.6}
.wrap{max-width:640px;margin:0 auto;padding:40px 20px}
.star{color:#C9A96A}
h1{color:#C9A96A;font-size:1.45rem;margin:18px 0 4px}
.ar{font-size:1.6rem;color:#E8DCC0;direction:rtl}
.when{color:#C9A96A;font-size:1.05rem;margin:0 0 14px}
.chip{display:inline-block;background:#1E4344;border-radius:20px;padding:3px 12px;font-size:.8rem;margin:3px 4px 3px 0;color:#C9A96A}
.desc{font-size:1.02rem}
.btn{display:inline-block;background:#C9A96A;color:#0F2620;font-weight:600;text-decoration:none;border-radius:10px;padding:12px 24px;margin-top:22px;margin-right:10px}
.foot{margin-top:40px;padding-top:16px;border-top:1px solid #1E4344;color:#8FB3B0;font-size:.85rem}
.foot a{color:#C9A96A;text-decoration:none}
.src{color:#8FB3B0;font-size:.9rem;margin-top:14px}
</style>
</head>
<body>
<div class="wrap">
<div style="font-size:.95rem"><span class="star">✦</span> Turath <span style="color:#8FB3B0">تراث</span> — Islamic Manuscripts &amp; History</div>
<h1>${esc(e.title)}</h1>
${e.title_ar ? `<div class="ar">${esc(e.title_ar)}</div>` : ''}
<div class="when">${esc(when)}</div>
<div>${meta.map(([k, v]) => `<span class="chip"><b>${k}:</b> ${esc(v)}</span>`).join('')}</div>
<p class="desc">${esc(e.description || '')}</p>
${e.description_ar ? `<p class="desc" dir="rtl">${esc(e.description_ar)}</p>` : ''}
${e.sources ? `<div class="src">📚 ${esc(e.sources)}</div>` : ''}
<div>
${e.source_url ? `<a class="btn" href="${esc(e.source_url)}" target="_blank" rel="noopener">Source →</a>` : ''}
<a class="btn" href="${SITE}">Open Turath timeline</a>
</div>
<div class="foot">Part of the <a href="${SITE}">Turath</a> archive of Islamic manuscripts and history. Content is curated with respect.</div>
</div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' });
    res.end(html);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(page404('Server error'));
  }
}

function page404(msg) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found — Turath</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#0F2620;color:#F3ECDA;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center}
a{color:#C9A96A}</style></head><body><div><div style="font-size:2rem">✦</div>
<h2>${msg || 'Event not found'}</h2><p><a href="https://turath-green.vercel.app">← Back to Turath</a></p></div></body></html>`;
}
