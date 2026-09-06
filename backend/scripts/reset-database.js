#!/usr/bin/env node

/**
 * Reset Database Script
 * 
 * WARNING: This will DROP ALL TABLES and recreate them
 * Use with caution!
 */

const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../src/models');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetDatabase() {
  console.log('\n⚠️  DATABASE RESET WARNING ⚠️');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('This will:');
  console.log('  1. DROP all existing tables');
  console.log('  2. RECREATE tables with INTEGER IDs');
  console.log('  3. DELETE all existing data');
  console.log('');
  console.log('⛔ THIS CANNOT BE UNDONE ⛔');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const answer = await question('Type "YES" to continue: ');

  if (answer !== 'YES') {
    console.log('\n❌ Operation cancelled\n');
    rl.close();
    process.exit(0);
  }

  try {
    console.log('\n🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    console.log('🗑️  Dropping all tables...');
    await sequelize.drop();
    console.log('✅ All tables dropped\n');

    console.log('📦 Creating tables with new schema...');
    await sequelize.sync({ force: false });
    console.log('✅ Tables created successfully\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database reset complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run seed:demo');
    console.log('  2. Run: npm run sync:incidents');
    console.log('');

  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await sequelize.close();
  }
}

// Run the reset
resetDatabase();
