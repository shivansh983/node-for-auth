const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const PREVIEW_DIR = path.join(UPLOADS_DIR, 'preview');

// POST /api/upload
const uploadPdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was uploaded' });
  }

  const result = await query(
    `INSERT INTO files (name, saved_as, size)
     VALUES ($1, $2, $3)
     RETURNING id, name, saved_as, size, uploaded_at`,
    [req.file.originalname, req.file.filename, req.file.size]
  );

  const row = result.rows[0];

  res.status(201).json({
    message: 'File uploaded!',
    file: {
      id: row.id,
      name: row.name,
      savedAs: row.saved_as,
      size: row.size,
      url: `/uploads/${row.saved_as}`,
    },
  });
};

// GET /api/upload
const getFiles = async (req, res) => {
  const result = await query(
    `SELECT id, name, saved_as, size, uploaded_at
     FROM files
     ORDER BY uploaded_at DESC`
  );

  const files = result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    savedAs: row.saved_as,
    size: row.size,
    uploadedAt: row.uploaded_at,
    url: `/uploads/${row.saved_as}`,
  }));

  res.json({ files });
};

// office -> pdf
const previewFile = (req, res) => {
  const name = path.basename(req.params.name);
  const source = path.join(UPLOADS_DIR, name);

  if (!fs.existsSync(source)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // no convert needed
  if (/\.(pdf|jpe?g|png|webp|gif)$/i.test(name)) {
    return res.sendFile(source);
  }

  const outPath = path.join(PREVIEW_DIR, name.replace(/\.[^.]+$/, '.pdf'));

  // converted earlier
  if (fs.existsSync(outPath)) {
    return res.sendFile(outPath);
  }

  fs.mkdirSync(PREVIEW_DIR, { recursive: true });

  execFile(
    'soffice',
    ['--headless', '--convert-to', 'pdf', '--outdir', PREVIEW_DIR, source],
    { timeout: 60000 },
    (err) => {
      if (err || !fs.existsSync(outPath)) {
        return res.status(500).json({ error: 'Could not convert this file' });
      }
      res.sendFile(outPath);
    },
  );
};

module.exports = { uploadPdf, getFiles, previewFile };
