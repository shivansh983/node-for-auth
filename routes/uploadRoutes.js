const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  uploadFile,
  getFiles,
  renameFile,
  deleteFile,
  previewFile,
} = require('../controller/uploadController');
const { UPLOADS_DIR, safeName } = require('../lib/files');

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // temp name, controller renames it
    cb(null, `${Date.now()}-${safeName(file.originalname)}`);
  },
});

// from .env
const MAX_MB = Number(process.env.MAX_UPLOAD_MB) || 10;

// allowed types
const ALLOWED = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
];

const ALLOWED_EXT = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpe?g|png|webp|gif)$/i;

const fileFilter = (req, file, cb) => {
  // phones send octet-stream
  const ok =
    ALLOWED.includes(file.mimetype) || ALLOWED_EXT.test(file.originalname);

  if (ok) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Office, image and text files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

// routes
router.post('/', upload.single('file'), uploadFile);
router.get('/', getFiles);
router.patch('/:id', renameFile);
router.delete('/:id', deleteFile);
router.get('/preview/:name', previewFile);

// errors
router.use((err, req, res, next) => {
  const badFile =
    err instanceof multer.MulterError || /allowed/i.test(err.message);

  if (!badFile) {
    console.error('Upload error:', err.message);
  }

  const message =
    err.code === 'LIMIT_FILE_SIZE'
      ? `File is too large. The limit is ${MAX_MB} MB.`
      : err.message;

  res.status(badFile ? 400 : 500).json({ error: message });
});

module.exports = router;
