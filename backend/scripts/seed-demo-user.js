#!/usr/bin/env node

/**
 * Seed Demo User Script
 *
 * Inserts a demo owner user + role into the database.
 * Safe to run multiple times — skips if user already exists.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const crypto = require('crypto');

// Simple hash for dev seed (no bcrypt dependency needed)
function hashPassword(plain) {
  return '$dev$' + crypto.createHash('sha256').update(plain).digest('hex');
}

async function seedDemoUser() {
  // Lazy-load models AFTER dotenv is configured
  const { sequelize, User, Role, UserRole } = require('../src/models');

  console.log('\n👤 Seeding demo user...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // ── 1. Ensure the "owner" role exists ─────────────────────────────
    const [ownerRole] = await Role.findOrCreate({
      where: { name: 'owner' },
      defaults: {
        name: 'owner',
        display_name: 'Building Owner',
        description: 'Can manage buildings and view incidents',
        permissions: ['incidents:read', 'buildings:read', 'buildings:write'],
        is_system_role: true,
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Role: ${ownerRole.display_name} (id=${ownerRole.id})`);

    // ── 2. Check if demo user already exists ──────────────────────────
    const existing = await User.findOne({ where: { email: 'morgan.reed@atmarakshak.com' } });
    if (existing) {
      console.log(`⏩ Demo user already exists (id=${existing.id}), skipping`);
      console.log(`\n📋 User details:`);
      console.log(`   ID    : ${existing.id}`);
      console.log(`   Name  : ${existing.first_name} ${existing.last_name}`);
      console.log(`   Email : ${existing.email}`);
      console.log(`   Phone : ${existing.phone}`);
      await sequelize.close();
      return;
    }

    // ── 3. Hash password ──────────────────────────────────────────────
    const password_hash = hashPassword('Demo@1234');

    // ── 4. Create user ────────────────────────────────────────────────
    const user = await User.create({
      first_name: 'Morgan',
      last_name: 'Reed',
      email: 'morgan.reed@atmarakshak.com',
      phone: '+919876543210',
      password_hash,
      status: 'ACTIVE',
    });
    console.log(`✅ User created: ${user.first_name} ${user.last_name} (id=${user.id})`);

    // ── 5. Assign role ─────────────────────────────────────────────────
    await sequelize.query(
      `INSERT INTO user_roles (user_id, role_id, created_at, updated_at) VALUES (:uid, :rid, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      { replacements: { uid: user.id, rid: ownerRole.id } }
    );
    console.log(`✅ Role "${ownerRole.display_name}" assigned`);

    console.log('\n🎉 Done!\n');
    console.log('📋 Demo user credentials:');
    console.log(`   ID       : ${user.id}`);
    console.log(`   Name     : ${user.first_name} ${user.last_name}`);
    console.log(`   Email    : morgan.reed@atmarakshak.com`);
    console.log(`   Password : Demo@1234`);
    console.log(`   API URL  : http://localhost:3001/api/users/${user.id}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding user:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  -', e.message));
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedDemoUser();
