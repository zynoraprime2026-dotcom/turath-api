const { withDb, send } = require('../_lib');

// GET /api/m/:id — PUBLIC server-rendered detail page (no API key needed).
// Used for shareable URLs + WhatsApp/OpenGraph previews via the frontend
// rewrite: turath-green.vercel.app/m/:id -> turath-api.vercel.app/api/m/:id
export default async function handler(req, res) {
  try {
    const id = parseInt(req.query.id);
    if (!id) { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(page404()); return; }
    const m = await withDb(async c => (await c.query('SELECT * FROM manuscripts WHERE id=$1', [id])).rows[0]);
    if (!m) { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(page404()); return; }

    const SITE = 'https://turath-green.vercel.app';
    const pageUrl = `${SITE}/m/${id}`;
    const appUrl = `${SITE}/#m/${id}`;
    const img = m.image_url || null;
    const title = m.title + (m.title_ar ? ' · ' + m.title_ar : '');
    const desc = (m.description || 'An Islamic manuscript in the Turath archive.').slice(0, 220);
    const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    const meta = m ? [
      ['author', m.author || 'Turath'],
      ['subject', m.subject], ['region', m.region],
      ['century', m.century ? m.century + 'th century AH' : ''],
      ['language', m.language], ['script', m.script], ['holding', m.holding]
    ].filter(([, v]) => v) : [];

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
<meta property="og:title" content="${esc(m.title)}${m.title_ar ? ' · ' + esc(m.title_ar) : ''}">
<meta property="og:description" content="${esc(desc)}">
${img ? `<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(img)}">` : `<meta name="twitter:card" content="summary">`}
<meta name="twitter:title" content="${esc(m.title)}">
<meta name="twitter:description" content="${esc(desc)}">
<style>
body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#0F2620;color:#F3ECDA;line-height:1.6}
.wrap{max-width:640px;margin:0 auto;padding:40px 20px}
.star{color:#C9A96A}
h1{color:#C9A96A;font-size:1.45rem;margin:18px 0 4px}
.ar{font-size:1.6rem;color:#E8DCC0;direction:rtl}
.meta{color:#8FB3B0;font-size:.95rem;margin:6px 0 16px}
.chip{display:inline-block;background:#1E4344;border-radius:20px;padding:3px 12px;font-size:.8rem;margin:3px 4px 3px 0;color:#C9A96A}
.desc{font-size:1.02rem}
.btn{display:inline-block;background:#C9A96A;color:#0F2620;font-weight:600;text-decoration:none;border-radius:10px;padding:12px 24px;margin-top:22px}
.foot{margin-top:40px;padding-top:16px;border-top:1px solid #1E4344;color:#8FB3B0;font-size:.85rem}
.foot a{color:#C9A96A;text-decoration:none}
img.hero{width:100%;border-radius:12px;margin-bottom:6px}
</style>
</head>
<body>
<div class="wrap">
<div style="font-size:.95rem"><span class="star">✦</span> Turath <span style="color:#8FB3B0">تراث</span> — Islamic Manuscripts &amp; History</div>
${img ? `<img class="hero" src="${esc(img)}" alt="">` : ''}
<h1>${esc(m.title)}</h1>
${m.title_ar ? `<div class="ar">${esc(m.title_ar)}</div>` : ''}
<div class="meta">${esc(m.author || 'Unknown author')}${m.date_written ? ' · ' + esc(m.date_written) : ''}</div>
<div>${meta.map(([k, v]) => `<span class="chip"><b>${k}:</b> ${esc(v)}</span>`).join('')}</div>
<p class="desc">${esc(m.description || '')}</p>
${m.description_ar ? `<p class="desc" dir="rtl">${esc(m.description_ar)}</p>` : ''}
${m.digital_url ? `<p><a class="btn" href="${esc(m.digital_url)}" target="_blank" rel="noopener">View digitized manuscript →</a></p>` : ''}
${m.read_url ? `<p><a class="btn" href="${esc(m.read_url)}" target="_blank" rel="noopener">Read the full text (free edition) →</a></p>` : ''}
<a class="btn" href="${appUrl}">Open in Turath</a>
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
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not found — Turath</title>
<meta name="robots" content="noindex">
<style>body{margin:0;font-family:system-ui,sans-serif;background:#0F2620;color:#F3ECDA;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center}a{color:#C9A96A}</style>
</head><body><div><div style="font-size:2rem">📜</div><h2 style="color:#C9A96A">Manuscript not found</h2>
<p>${msg || 'This manuscript is not in the Turath archive.'}<br><a href="https://turath-green.vercel.app">← Back to Turath</a></p></div></body></html>`;
}
