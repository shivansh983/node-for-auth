const { Sequelize } = require('sequelize');

const required = ['DB_NAME', 'DB_USERNAME', 'DB_HOST'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing in .env: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      // created_at, not createdAt
      underscored: true,
    },
  },
);

module.exports = { sequelize };
