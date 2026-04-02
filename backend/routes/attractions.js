const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { search, category, destinationId, page = 1, limit = 20 } = req.query;
    let query = 'SELECT a.*, d.name as destination_name FROM attractions a LEFT JOIN destinations d ON a.destination_id = d.id WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) { query += ` AND (a.name ILIKE $${idx} OR a.description ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (category && category !== 'all') { query += ` AND a.category = $${idx}`; params.push(category); idx++; }
    if (destinationId) { query += ` AND a.destination_id = $${idx}`; params.push(destinationId); idx++; }

    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ' ORDER BY a.rating DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT a.*, d.name as destination_name FROM attractions a LEFT JOIN destinations d ON a.destination_id = d.id WHERE a.id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, location, destination_id, image, category, entry_fee, currency, rating, opening_hours } = req.body;
    const result = await pool.query(
      'INSERT INTO attractions (name, description, location, destination_id, image, category, entry_fee, currency, rating, opening_hours) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [name, description, location, destination_id || null, image, category, entry_fee || 0, currency || 'GHS', rating || 0, opening_hours]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, location, destination_id, image, category, entry_fee, currency, rating, opening_hours } = req.body;
    const result = await pool.query(
      'UPDATE attractions SET name=$1, description=$2, location=$3, destination_id=$4, image=$5, category=$6, entry_fee=$7, currency=$8, rating=$9, opening_hours=$10 WHERE id=$11 RETURNING *',
      [name, description, location, destination_id || null, image, category, entry_fee || 0, currency || 'GHS', rating || 0, opening_hours, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM attractions WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
