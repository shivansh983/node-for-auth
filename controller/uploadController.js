const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const PREVIEW_DIR = path.join(UPLOADS_DIR, 'preview');

// POST /api/upload
const uploadPdf = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was uploaded' });
  }

  res.status(201).json({
    message: 'File uploaded!',
    file: {
      name: req.file.originalname,
      savedAs: req.file.filename,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
    },
  });
};

// GET /api/upload
const getFiles = (req, res) => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    return res.json({ files: [] });
  }

  const files = fs
    .readdirSync(UPLOADS_DIR)
    .filter((name) => /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpe?g|png|webp|gif)$/i.test(name))
    .map((name) => {
      const stats = fs.statSync(path.join(UPLOADS_DIR, name));
      return {
        name,
        size: stats.size,
        uploadedAt: stats.mtime,
        url: `/uploads/${name}`,
      };
    })
    .sort((a, b) => b.uploadedAt - a.uploadedAt);

  res.json({ files });
};

// office file -> pdf so the app can show it
const previewFile = (req, res) => {
  const name = path.basename(req.params.name);
  const source = path.join(UPLOADS_DIR, name);

  if (!fs.existsSync(source)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // pdf and images need no converting
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
