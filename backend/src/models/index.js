/**
 * Sequelize Models Index
 * 
 * Auto-loads all model files from this directory and initializes them.
 * This file serves as the central hub for all database models.
 * 
 * Usage:
 *   const db = require('./models');
 *   const User = db.User;
 *   const allModels = db.models;
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/sequelize');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const db = {};

// Auto-load all model files in this directory
// Each model file should export a function that takes (sequelize, DataTypes)
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Run associate methods to set up relationships between models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Add sequelize instance and Sequelize constructor for convenience
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Helper methods
db.getModelNames = () => Object.keys(db).filter(key => !['sequelize', 'Sequelize'].includes(key));
db.getModelCount = () => db.getModelNames().length;

module.exports = db;
