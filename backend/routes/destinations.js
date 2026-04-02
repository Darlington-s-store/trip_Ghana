const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { search, region, featured, page = 1, limit = 20 } = req.query;
    let query = `SELECT d.*, 
      (SELECT COUNT(*) FROM hotels WHERE destination_id = d.id) as hotel_count,
      (SELECT COUNT(*) FROM attractions WHERE destination_id = d.id) as attraction_count
      FROM destinations d WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (search) { query += ` AND (d.name ILIKE $${idx} OR d.description ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (region) { query += ` AND d.region ILIKE $${idx}`; params.push(`%${region}%`); idx++; }
    if (featured === 'true') query += ' AND d.featured = true';

    const countQuery = `SELECT COUNT(*) FROM destinations d WHERE 1=1` + (search ? ` AND (d.name ILIKE $1 OR d.description ILIKE $1)` : '') + (region ? ` AND d.region ILIKE $${search ? 2 : 1}` : '') + (featured === 'true' ? ' AND d.featured = true' : '');
    const countParams = [];
    if (search) countParams.push(`%${search}%`);
    if (region) countParams.push(`%${region}%`);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    query += ' ORDER BY d.featured DESC, d.name ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const result = await pool.query(`SELECT d.*,
      (SELECT COUNT(*) FROM hotels WHERE destination_id = d.id) as hotel_count,
      (SELECT COUNT(*) FROM attractions WHERE destination_id = d.id) as attraction_count
      FROM destinations d WHERE d.slug = $1`, [req.params.slug]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Destination not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM destinations WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, short_description, image, region, featured } = req.body;
    const result = await pool.query(
      'INSERT INTO destinations (name, slug, description, short_description, image, region, featured) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, slug, description, short_description, image, region, featured || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, short_description, image, region, featured } = req.body;
    const result = await pool.query(
      'UPDATE destinations SET name=$1, slug=$2, description=$3, short_description=$4, image=$5, region=$6, featured=$7 WHERE id=$8 RETURNING *',
      [name, slug, description, short_description, image, region, featured || false, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM destinations WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
