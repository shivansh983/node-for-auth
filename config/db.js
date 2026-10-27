const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../users.json');

const getUsers = () => {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};

const saveUsers = (users) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

module.exports = { getUsers, saveUsers };