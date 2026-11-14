const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { FileAsset } = require('../models');
const {
  UPLOADS_DIR,
  PREVIEW_DIR,
  renameOnDisk,
  clearPreview,
} = require('../lib/files');

// POST /api/upload
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was uploaded' });
  }

  // app can send a name
  const typed = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const display = typed || req.file.originalname;

  let savedAs = req.file.filename;

  try {
    savedAs = renameOnDisk(savedAs, display);
  } catch (err) {
    console.error('Could not rename upload:', err.message);
  }

  const row = await FileAsset.create({
    name: display,
    originalName: req.file.originalname,
    savedAs,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });

  res.status(201).json({ message: 'File uploaded!', file: row.toJSON() });
};

// GET /api/upload
const getFiles = async (req, res) => {
  const rows = await FileAsset.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ files: rows.map((row) => row.toJSON()) });
};

// PATCH /api/upload/:id
const renameFile = async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    return res.status(400).json({ error: 'Please enter a name' });
  }

  const row = await FileAsset.findByPk(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'File not found' });
  }

  // move on disk too
  if (fs.existsSync(path.join(UPLOADS_DIR, row.savedAs))) {
    row.savedAs = renameOnDisk(row.savedAs, name);
  }

  row.name = name;
  await row.save();

  res.json({ message: 'Renamed', file: row.toJSON() });
};

// DELETE /api/upload/:id
const deleteFile = async (req, res) => {
  const row = await FileAsset.findByPk(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.rmSync(path.join(UPLOADS_DIR, row.savedAs), { force: true });
  clearPreview(row.savedAs);
  await row.destroy();

  res.json({ message: 'Deleted', id: Number(req.params.id) });
};

// office -> pdf for the viewer
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
        return res
          .status(500)
          .json({ error: 'Could not convert this file for preview' });
      }
      res.sendFile(outPath);
    },
  );
};

module.exports = {
  uploadFile,
  getFiles,
  renameFile,
  deleteFile,
  previewFile,
};
