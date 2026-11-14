// makes the database in .env if missing
require('dotenv').config({ quiet: true });

const { Client } = require('pg');

const name = process.env.DB_NAME;

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  // always there
  database: 'postgres',
});

const run = async () => {
  await client.connect();

  const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    name,
  ]);

  if (found.rowCount > 0) {
    console.log(`database "${name}" is already there`);
  } else {
    // cannot be a bound parameter
    await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
    console.log(`created database "${name}"`);
  }

  await client.end();
};

run().catch((err) => {
  console.error(`Could not create "${name}": ${err.message}`);
  console.error('Check that postgres is running and .env is right.');
  process.exit(1);
});
