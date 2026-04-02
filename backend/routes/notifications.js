const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.userId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = true WHERE user_id = $1', [req.user.userId]);
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
