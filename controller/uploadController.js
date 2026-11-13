const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

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
    .filter((name) => /\.(pdf|doc|docx|txt)$/i.test(name))
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

module.exports = { uploadPdf, getFiles };
