const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FileAsset = sequelize.define(
  'FileAsset',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // shown in the app
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // picked on the phone
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // on disk
    savedAs: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    mimeType: {
      type: DataTypes.STRING,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'files',
    timestamps: true,
  },
);

// json for the app
FileAsset.prototype.toJSON = function () {
  return {
    id: this.id,
    name: this.name,
    originalName: this.originalName,
    savedAs: this.savedAs,
    mimeType: this.mimeType,
    size: this.size,
    uploadedAt: this.createdAt,
    renamedAt: this.updatedAt,
    url: `/uploads/${encodeURIComponent(this.savedAs)}`,
  };
};

module.exports = FileAsset;
