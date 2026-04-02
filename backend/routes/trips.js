const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    const result = await pool.query(`
      SELECT t.*, u.first_name, u.last_name, u.email 
      FROM trips t JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC', [req.user.userId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Trip not found' });
    
    const trip = result.rows[0];
    if (trip.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    res.json({ success: true, data: trip });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      title, destination, start_date, end_date, 
      itinerary, transport_details, activities, 
      total_budget, currency, status, items, budget_items 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO trips (
        user_id, title, destination, start_date, end_date, 
        itinerary, transport_details, activities, 
        total_budget, currency, status, items, budget_items
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        req.user.userId, title, destination, start_date, end_date, 
        itinerary || [], transport_details || {}, activities || [], 
        total_budget || 0, currency || 'GHS', status || 'draft', 
        items || [], budget_items || []
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { 
      title, destination, start_date, end_date, 
      itinerary, transport_details, activities, 
      total_budget, currency, status, items, budget_items 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE trips SET 
        title=$1, destination=$2, start_date=$3, end_date=$4, 
        itinerary=$5, transport_details=$6, activities=$7, 
        total_budget=$8, currency=$9, status=$10, 
        items=$11, budget_items=$12 
      WHERE id=$13 AND user_id=$14 RETURNING *`,
      [
        title, destination, start_date, end_date, 
        itinerary, transport_details, activities, 
        total_budget, currency, status, 
        items, budget_items, 
        req.params.id, req.user.userId
      ]
    );
    
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.userId]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, message: 'Trip deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
