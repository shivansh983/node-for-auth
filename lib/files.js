const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const PREVIEW_DIR = path.join(UPLOADS_DIR, 'preview');

// fresh clone has no uploads/
const ensureDirs = () => {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
};

// "my report!.pdf" -> "my_report_.pdf"
const safeName = (name) =>
  path
    .basename(String(name).trim())
    .replace(/[^a-zA-Z0-9.\-_ ]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);

// keep the extension
const keepExtension = (name, previous) => {
  const ext = path.extname(previous);
  if (!ext) return name;
  return path.extname(name).toLowerCase() === ext.toLowerCase()
    ? name
    : `${name}${ext}`;
};

// no overwrite
const freeDiskName = (desired) => {
  const ext = path.extname(desired);
  const base = desired.slice(0, desired.length - ext.length);

  let candidate = desired;
  let n = 2;

  while (fs.existsSync(path.join(UPLOADS_DIR, candidate))) {
    candidate = `${base}-${n}${ext}`;
    n += 1;
  }

  return candidate;
};

// drop stale preview
const clearPreview = (savedAs) => {
  if (!savedAs) return;
  const stale = path.join(PREVIEW_DIR, savedAs.replace(/\.[^.]+$/, '.pdf'));
  fs.rmSync(stale, { force: true });
};

// rename on disk
const renameOnDisk = (currentSavedAs, displayName) => {
  const wanted = freeDiskName(keepExtension(safeName(displayName), currentSavedAs));

  if (wanted === currentSavedAs) return currentSavedAs;

  fs.renameSync(
    path.join(UPLOADS_DIR, currentSavedAs),
    path.join(UPLOADS_DIR, wanted),
  );
  clearPreview(currentSavedAs);

  return wanted;
};

module.exports = {
  UPLOADS_DIR,
  PREVIEW_DIR,
  ensureDirs,
  safeName,
  keepExtension,
  freeDiskName,
  clearPreview,
  renameOnDisk,
};
