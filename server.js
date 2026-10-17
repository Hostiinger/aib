const express = require('express');
const multer = require('multer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const DATA_DIR = path.join(ROOT, 'data');
for (const dir of [PUBLIC_DIR, UPLOAD_DIR, DATA_DIR]) fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'gallery.db'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
const app = express();
app.disable('x-powered-by');
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOAD_DIR, { fallthrough: false, maxAge: '1h' }));
const mimeExt = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'image/avif': '.avif' };
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${mimeExt[file.mimetype] || '.img'}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 10 }, fileFilter: (_req, file, cb) => {
  if (!mimeExt[file.mimetype]) return cb(new Error('Format foto tidak didukung. Gunakan JPG, PNG, GIF, WEBP, atau AVIF.'));
  cb(null, true);
}});
app.get('/api/images', (_req, res) => {
  const images = db.prepare('SELECT filename, original_name, mime_type, size_bytes, created_at FROM images ORDER BY id DESC LIMIT 500').all()
    .map(img => ({ ...img, url: `/uploads/${encodeURIComponent(img.filename)}` }));
  res.json({ images });
});
app.post('/api/upload', (req, res) => {
  upload.array('photos', 10)(req, res, err => {
    if (err) return res.status(400).json({ error: err.message || 'Upload gagal.' });
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'Pilih foto terlebih dahulu.' });
    const insert = db.prepare('INSERT INTO images (filename, original_name, mime_type, size_bytes) VALUES (?, ?, ?, ?)');
    const save = db.transaction(items => { for (const f of items) insert.run(f.filename, path.basename(f.originalname).slice(0, 240), f.mimetype, f.size); });
    try { save(files); res.json({ ok: true, uploaded: files.length }); }
    catch (e) { for (const f of files) { try { fs.unlinkSync(f.path); } catch {} } console.error(e); res.status(500).json({ error: 'Foto tersimpan gagal dicatat di database.' }); }
  });
});
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Terjadi kesalahan pada server.' }); });
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`Galeri berjalan di http://localhost:${port}`));
