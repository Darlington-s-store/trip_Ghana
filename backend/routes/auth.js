const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { notify } = require('../utils/notifier');

const JWT_SECRET = process.env.JWT_SECRET || 'ghanatravel-secret-key-change-in-production';

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ success: false, message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, role, created_at',
      [email, hashedPassword, firstName, lastName]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, data: { user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role, createdAt: user.created_at }, token } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, phone: user.phone, avatar: user.avatar, role: user.role, createdAt: user.created_at }, token } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1 AND role = 'admin'", [email]);
    if (!result.rows.length) return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    const token = jwt.sign({ userId: user.id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: 'admin', createdAt: user.created_at }, token } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, first_name, last_name, phone, avatar, role, created_at FROM users WHERE id = $1', [req.user.userId]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const u = result.rows[0];
    res.json({ success: true, data: { id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, phone: u.phone, avatar: u.avatar, role: u.role, createdAt: u.created_at } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const result = await pool.query(
      'UPDATE users SET first_name=$1, last_name=$2, phone=$3 WHERE id=$4 RETURNING id, email, first_name, last_name, phone, avatar, role, created_at',
      [firstName, lastName, phone, req.user.userId]
    );
    const u = result.rows[0];
    res.json({ success: true, data: { id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, phone: u.phone, avatar: u.avatar, role: u.role, createdAt: u.created_at } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.userId]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, req.user.userId]);
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const userResult = await pool.query('SELECT id, first_name FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      // Security: Always return success for existence verification prevention
      return res.json({ success: true, message: 'If that email exists, a reset code has been sent.' });
    }
    
    const user = userResult.rows[0];
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(resetCode).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, codeHash, expiresAt]
    );

    // Trigger notification
    await notify({
      userId: user.id,
      title: 'Reset Password Code',
      message: `Hello ${user.first_name}, your 6-digit verification code is: ${resetCode}. It expires in 15 minutes.`,
      channel: 'both' // Send email and sms
    });

    res.json({ success: true, message: 'If that email exists, a reset code has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const user = userResult.rows[0];

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const matching = await pool.query(
      'SELECT id FROM password_reset_tokens WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW() AND used_at IS NULL LIMIT 1',
      [user.id, codeHash]
    );

    if (matching.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [matching.rows[0].id]);

    res.json({ success: true, message: 'Your password has been reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
