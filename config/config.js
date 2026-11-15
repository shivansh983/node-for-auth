require('dotenv').config({ quiet: true });

// the cli reads this file, not db.js
const settings = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
};

module.exports = {
  development: settings,
  test: settings,
  production: settings,
};
