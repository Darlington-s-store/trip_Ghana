const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log('Starting migration on original database...');
    
    // 1. Create platform_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table platform_settings ensured.');

    // 2. Insert default settings
    const defaultSettings = [
      ['platform_fee', '10.00', 'Percentage fee charged on all bookings'],
      ['support_email', 'support@tripghana.com', 'Contact email for support'],
      ['maintenance_mode', 'false', 'Enable/disable site-wide maintenance mode'],
      ['admin_approval_required', 'true', 'Whether manual admin approval is needed for new trips'],
      ['max_guests_per_booking', '20', 'Limit the number of guests in a single reservation'],
      ['currency', 'GHS', 'Default platform currency'],
      ['booking_window_days', '180', 'How many days in advance users can book'],
      ['terms_of_service_url', '/terms', 'Link to legal terms'],
      ['privacy_policy_url', '/privacy', 'Link to privacy policy'],
      ['min_booking_amount', '50.00', 'Minimum value for any transaction'],
      ['enable_notifications', 'true', 'Global toggle for system notifications'],
      ['loyalty_points_multiplier', '1.5', 'Points earned per GHS spent'],
      ['featured_limit', '6', 'Maximum number of items highlighted on homepage'],
      ['site_name', 'Trip Ghana', 'The display name of the platform']
    ];

    for (const [key, value, desc] of defaultSettings) {
      await pool.query(
        'INSERT INTO platform_settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
        [key, value, desc]
      );
    }
    console.log('Default settings initialized.');

    // 3. Ensure password_reset_tokens exists
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
    console.log('Table password_reset_tokens ensured.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
