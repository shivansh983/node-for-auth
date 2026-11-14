const { sequelize } = require('../config/db');
const FileAsset = require('./file');

// one table: files
module.exports = { sequelize, FileAsset };
