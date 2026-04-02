const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  try {
    console.log('Reading schema.sql...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    console.log('Connecting to database and running schema...');
    await pool.query(schema);
    
    console.log('Database initialized successfully!');
    
    // Check if an admin exists, if not create one
    const adminEmail = 'admin@ghanatravel.com';
    const checkAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    
    if (checkAdmin.rows.length === 0) {
      console.log('Creating default admin user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        "INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, 'admin')",
        [adminEmail, hashedPassword, 'System', 'Admin']
      );
      console.log('Default admin created: ' + adminEmail + ' / admin123');
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDb();
