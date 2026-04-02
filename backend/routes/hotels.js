const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { search, location, destinationId, minPrice, maxPrice, featured, sort, page = 1, limit = 20 } = req.query;
    let query = 'SELECT h.*, d.name as destination_name FROM hotels h LEFT JOIN destinations d ON h.destination_id = d.id WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) { query += ` AND (h.name ILIKE $${idx} OR h.description ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (location) { query += ` AND h.location ILIKE $${idx}`; params.push(`%${location}%`); idx++; }
    if (destinationId) { query += ` AND h.destination_id = $${idx}`; params.push(destinationId); idx++; }
    if (minPrice) { query += ` AND h.price_per_night >= $${idx}`; params.push(minPrice); idx++; }
    if (maxPrice) { query += ` AND h.price_per_night <= $${idx}`; params.push(maxPrice); idx++; }
    if (featured === 'true') { query += ' AND h.featured = true'; }

    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    if (sort === 'price_asc') query += ' ORDER BY h.price_per_night ASC';
    else if (sort === 'price_desc') query += ' ORDER BY h.price_per_night DESC';
    else if (sort === 'rating') query += ' ORDER BY h.rating DESC';
    else query += ' ORDER BY h.featured DESC, h.rating DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, d.name as destination_name,
      (SELECT json_agg(rt.*) FROM room_types rt WHERE rt.hotel_id = h.id) as room_types
      FROM hotels h LEFT JOIN destinations d ON h.destination_id = d.id WHERE h.id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Hotel not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, location, destination_id, price_per_night, currency, images, amenities, featured } = req.body;
    const result = await pool.query(
      'INSERT INTO hotels (name, description, location, destination_id, price_per_night, currency, images, amenities, featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, description, location, destination_id || null, price_per_night, currency || 'GHS', images || [], amenities || [], featured || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, location, destination_id, price_per_night, currency, images, amenities, featured } = req.body;
    const result = await pool.query(
      'UPDATE hotels SET name=$1, description=$2, location=$3, destination_id=$4, price_per_night=$5, currency=$6, images=$7, amenities=$8, featured=$9 WHERE id=$10 RETURNING *',
      [name, description, location, destination_id || null, price_per_night, currency || 'GHS', images || [], amenities || [], featured || false, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM hotels WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Hotel deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
