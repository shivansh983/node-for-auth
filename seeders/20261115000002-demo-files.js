'use strict';

const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '../seed-assets');
const UPLOADS = path.join(__dirname, '../uploads');

// copied into uploads so they really open
const SAMPLES = [
  { file: 'sample.pdf', mime: 'application/pdf' },
  { file: 'notes.txt', mime: 'text/plain' },
];

const diskName = (file) => `seed-${file}`;

module.exports = {
  up: async (queryInterface) => {
    fs.mkdirSync(UPLOADS, { recursive: true });

    const now = new Date();
    const rows = [];

    for (const sample of SAMPLES) {
      const source = path.join(ASSETS, sample.file);
      if (!fs.existsSync(source)) continue;

      const savedAs = diskName(sample.file);
      fs.copyFileSync(source, path.join(UPLOADS, savedAs));

      rows.push({
        name: sample.file,
        original_name: sample.file,
        saved_as: savedAs,
        mime_type: sample.mime,
        size: fs.statSync(source).size,
        created_at: now,
        updated_at: now,
      });
    }

    if (rows.length) {
      await queryInterface.bulkInsert('files', rows);
    }
  },

  down: async (queryInterface) => {
    const names = SAMPLES.map((sample) => diskName(sample.file));

    for (const name of names) {
      fs.rmSync(path.join(UPLOADS, name), { force: true });
    }

    await queryInterface.bulkDelete('files', { saved_as: names });
  },
};
