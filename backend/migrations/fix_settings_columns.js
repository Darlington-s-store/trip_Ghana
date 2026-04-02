const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function addCategoryColumn() {
  try {
    console.log('Adding category column to platform_settings...');
    await pool.query(`
      ALTER TABLE platform_settings 
      ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'General';
    `);
    
    // Update some existing keys to better categories
    await pool.query(`
      UPDATE platform_settings SET category = 'Revenue' WHERE key IN ('platform_fee', 'min_booking_amount', 'loyalty_points_multiplier');
      UPDATE platform_settings SET category = 'System' WHERE key IN ('maintenance_mode', 'admin_approval_required', 'enable_notifications');
      UPDATE platform_settings SET category = 'UI' WHERE key IN ('site_name', 'featured_limit');
      UPDATE platform_settings SET category = 'Legal' WHERE key IN ('terms_of_service_url', 'privacy_policy_url');
      UPDATE platform_settings SET category = 'Support' WHERE key IN ('support_email');
    `);
    
    console.log('Column added and categorized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
}

addCategoryColumn();
