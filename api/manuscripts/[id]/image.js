const { put } = require('@vercel/blob');
const { withDb, send, guard } = require('../../../_lib');

// ---------- config ----------
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// ---------- multipart/form-data parser (single binary part, no dependencies) ----------
function parseMultipart(buf, contentType) {
  const bm = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!bm) return null;
  const delim = Buffer.from('--' + (bm[1] || bm[2]).trim());
  const parts = [];
  let pos = buf.indexOf(delim);
  while (pos !== -1) {
    let head = pos + delim.length;
    if (buf.slice(head, head + 2).toString() === '--') break;
    head += 2;
    const headEnd = buf.indexOf('\r\n\r\n', head);
    if (headEnd === -1) break;
    const headers = buf.slice(head, headEnd).toString();
    const next = buf.indexOf(delim, headEnd + 4);
    if (next === -1) break;
    const data = buf.slice(headEnd + 4, next - 2);
    const nm = /name="([^"]*)"/i.exec(headers);
    const cm = /content-type:\s*([^\r\n;]+)/i.exec(headers);
    parts.push({ name: nm ? nm[1] : '', contentType: cm ? cm[1].trim().toLowerCase() : null, data });
    pos = next;
  }
  return parts.length ? parts : null;
}

// ---------- magic-byte sniffing: never trust the declared content-type ----------
function detectImage(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { mime: 'image/png', ext: 'png' };
  if (buf.length >= 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

function readRawBody(req, cap) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', d => {
      size += d.length;
      if (size > cap) { reject(Object.assign(new Error('body too large'), { tooLarge: true })); req.destroy(); return; }
      chunks.push(d);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// POST /api/manuscripts/:id/image (admin) — attach a photo/scan to a manuscript, stored in Vercel Blob
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    if (req.method !== 'POST') { send(res, 404, { error: 'Not found' }); return; }
    const id = parseInt(req.query.id);
    if (!id) { send(res, 400, { error: 'Invalid id' }); return; }
    const declaredLen = parseInt(req.headers['content-length'] || '0');
    if (declaredLen > MAX_IMAGE_BYTES + 1024) { send(res, 400, { error: 'File too large — max 5MB' }); return; }
    if (!process.env.BLOB_READ_WRITE_TOKEN) { send(res, 500, { error: 'Blob storage is not configured on the server' }); return; }

    const cur = await withDb(async c => (await c.query('SELECT id FROM manuscripts WHERE id=$1', [id])).rows[0]);
    if (!cur) { send(res, 404, { error: 'Manuscript not found' }); return; }

    const buf = await readRawBody(req, MAX_IMAGE_BYTES + 1024);
    const parts = parseMultipart(buf, req.headers['content-type']);
    const photo = parts ? parts.find(p => p.name === 'image' && p.data && p.data.length) : null;
    if (!photo) { send(res, 400, { error: 'No file found — send multipart/form-data with an "image" field' }); return; }
    if (photo.data.length > MAX_IMAGE_BYTES) { send(res, 400, { error: 'File too large — max 5MB' }); return; }
    const detected = detectImage(photo.data);
    if (!detected) { send(res, 400, { error: 'Only JPG, PNG or WebP images are allowed' }); return; }

    const blob = await put(`turath/manuscript-${id}-${Date.now()}.${detected.ext}`, photo.data, {
      access: 'public',
      contentType: detected.mime
    });
    const row = await withDb(async c => (await c.query('UPDATE manuscripts SET image_url=$1 WHERE id=$2 RETURNING id, image_url', [blob.url, id])).rows[0]);
    send(res, 200, { ok: true, imageUrl: row.image_url });
  } catch (e) {
    send(res, e.tooLarge ? 400 : 500, { error: e.tooLarge ? 'File too large — max 5MB' : 'Server error: ' + e.message });
  }
}
