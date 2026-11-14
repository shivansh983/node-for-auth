require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./config/db');
// const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Auth Server is running!' });
});

// app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 5000;

// db first, then listen
initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`backend on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    console.error('Is postgres running? Check DATABASE_URL in .env');
    process.exit(1);
  });
