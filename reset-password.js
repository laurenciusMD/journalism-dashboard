#!/usr/bin/env node
/**
 * Password reset utility
 * Resets password for user "Laurencius" to "BFF+isa2026"
 */

const bcrypt = require('bcrypt');
const { Client } = require('pg');

const SALT_ROUNDS = 10;
const USERNAME = 'Laurencius';
const NEW_PASSWORD = 'BFF+isa2026';

async function resetPassword() {
  // Database connection
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'postgres',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'journalism',
    user: process.env.POSTGRES_USER || 'journalism',
    password: process.env.POSTGRES_PASSWORD
  });

  try {
    console.log('🔐 Resetting password for user:', USERNAME);
    console.log('📝 New password:', NEW_PASSWORD);

    // Connect to database
    await client.connect();
    console.log('✓ Connected to database');

    // Generate password hash
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);
    console.log('✓ Generated password hash');

    // Update user password
    const result = await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE username = $2 RETURNING username, email, role',
      [passwordHash, USERNAME]
    );

    if (result.rows.length === 0) {
      console.error('❌ User not found:', USERNAME);
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✓ Password updated successfully');
    console.log('');
    console.log('User details:');
    console.log('  Username:', user.username);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('');
    console.log('✅ Password reset complete!');
    console.log('You can now log in with:');
    console.log('  Username:', USERNAME);
    console.log('  Password:', NEW_PASSWORD);

  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetPassword();
