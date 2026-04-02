const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all settings
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM platform_settings ORDER BY category, key');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Settings fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings (batch)
router.post('/update', authenticateToken, requireAdmin, async (req, res) => {
  const { settings } = req.body; // Array of { key, value }
  if (!Array.isArray(settings)) {
    return res.status(400).json({ error: 'Settings must be an array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of settings) {
      await client.query(
        'INSERT INTO platform_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
        [item.key, String(item.value)]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  } finally {
    client.release();
  }
});

module.exports = router;
