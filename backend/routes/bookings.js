const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, h.name as hotel_name, h.location as hotel_location, h.images as hotel_images
       FROM bookings b LEFT JOIN hotels h ON b.hotel_id = h.id
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`, [req.user.userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    let query = `SELECT b.*, h.name as hotel_name, u.email as user_email, u.first_name, u.last_name
       FROM bookings b LEFT JOIN hotels h ON b.hotel_id = h.id LEFT JOIN users u ON b.user_id = u.id WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (search) { query += ` AND (h.name ILIKE $${idx} OR u.email ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (status && status !== 'all') { query += ` AND b.status = $${idx}`; params.push(status); idx++; }

    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ' ORDER BY b.created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, h.name as hotel_name, h.location as hotel_location
       FROM bookings b LEFT JOIN hotels h ON b.hotel_id = h.id WHERE b.id = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { hotel_id, room_type, check_in, check_out, guests, total_price, currency } = req.body;
    const result = await pool.query(
      'INSERT INTO bookings (user_id, hotel_id, room_type, check_in, check_out, guests, total_price, currency) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [req.user.userId, hotel_id, room_type, check_in, check_out, guests, total_price, currency || 'GHS']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE bookings SET status='cancelled' WHERE id=$1 AND user_id=$2 RETURNING *",
      [req.params.id, req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *', [req.body.status, req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/payment', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE bookings SET payment_status=$1, status='confirmed' WHERE id=$2 RETURNING *",
      [req.body.payment_status, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
