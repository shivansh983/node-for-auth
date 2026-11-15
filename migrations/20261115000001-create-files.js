'use strict';

module.exports = {
  // create the files table
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // shown in the app
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // picked on the phone
      original_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // on disk
      saved_as: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      mime_type: {
        type: Sequelize.STRING,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('files');
  },
};
