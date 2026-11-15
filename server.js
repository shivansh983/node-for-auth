require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const { ensureDirs, UPLOADS_DIR } = require('./lib/files');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// uploads
ensureDirs();
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/', (req, res) => {
  res.json({ message: 'Upload server is running!' });
});

app.use('/api/upload', uploadRoutes);

// anything unhandled
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  // migrations own the schema
  await sequelize.authenticate();
  console.log(`postgres connected (${process.env.DB_NAME})`);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`backend on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error('Database connection failed:', err.message);
  console.error(
    `Is postgres running, and does the database "${process.env.DB_NAME}" exist? Check .env`,
  );
  process.exit(1);
});
