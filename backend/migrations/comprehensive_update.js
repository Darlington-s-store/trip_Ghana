const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log('Starting comprehensive schema update on original database...');
    
    // 1. Update bookings table
    console.log('Updating bookings table...');
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='hotel_id') THEN
          ALTER TABLE bookings ADD COLUMN hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='room_type') THEN
          ALTER TABLE bookings ADD COLUMN room_type VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='payment_status') THEN
          ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid';
        END IF;
      END $$;
    `);

    // 2. Platform settings
    console.log('Ensuring platform_settings...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const defaultSettings = [
      ['platform_fee', '10.0', 'Percentage fee charged on all bookings'],
      ['support_email', 'support@tripghana.com', 'Contact email for support'],
      ['maintenance_mode', 'false', 'Enable/disable site-wide maintenance mode'],
      ['admin_approval_required', 'true', 'Whether manual admin approval is needed for new trips'],
      ['currency', 'GHS', 'Default platform currency'],
      ['site_name', 'Trip Ghana', 'The display name of the platform']
    ];

    for (const [key, value, desc] of defaultSettings) {
      await pool.query(
        'INSERT INTO platform_settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
        [key, value, desc]
      );
    }

    // 3. Password reset tokens
    console.log('Ensuring password_reset_tokens...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
