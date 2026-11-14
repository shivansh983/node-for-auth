const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// query helper
const query = (text, params) => pool.query(text, params);

// tables
const initDb = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      saved_as TEXT NOT NULL,
      size INTEGER NOT NULL,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

module.exports = { query, initDb, pool };
