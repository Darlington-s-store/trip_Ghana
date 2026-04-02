const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    let query = 'SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) { query += ` AND (email ILIKE $${idx} OR first_name ILIKE $${idx} OR last_name ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (role && role !== 'all') { query += ` AND role = $${idx}`; params.push(role); idx++; }

    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ' ORDER BY created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, first_name, last_name, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, first_name, last_name, role, created_at',
      [email, hashed, first_name, last_name, role || 'user']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, first_name, last_name, phone, role, password } = req.body;
    let query = 'UPDATE users SET email=$1, first_name=$2, last_name=$3, phone=$4, role=$5';
    let params = [email, first_name, last_name, phone, role];
    
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query += ', password=$6 WHERE id=$7';
      params.push(hashed, req.params.id);
    } else {
      query += ' WHERE id=$6';
      params.push(req.params.id);
    }
    
    const result = await pool.query(query + ' RETURNING id, email, first_name, last_name, phone, role, created_at', params);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
