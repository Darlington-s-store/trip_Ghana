const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users, bookings, revenue, destinations, hotels, attractions] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM bookings'),
      pool.query("SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE payment_status = 'paid'"),
      pool.query('SELECT COUNT(*) FROM destinations'),
      pool.query('SELECT COUNT(*) FROM hotels'),
      pool.query('SELECT COUNT(*) FROM attractions'),
    ]);

    const recentBookings = await pool.query(
      `SELECT b.*, h.name as hotel_name, u.first_name, u.last_name, u.email as user_email
       FROM bookings b LEFT JOIN hotels h ON b.hotel_id = h.id LEFT JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC LIMIT 10`
    );

    // Monthly revenue for chart
    const monthlyRevenue = await pool.query(`
      SELECT DATE_TRUNC('month', created_at) as month, SUM(total_price) as revenue, COUNT(*) as bookings
      FROM bookings WHERE payment_status = 'paid' AND created_at > NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at) ORDER BY month
    `);

    // Top destinations
    const topDestinations = await pool.query(`
      SELECT d.name, COUNT(b.id) as booking_count, COALESCE(SUM(b.total_price), 0) as revenue
      FROM destinations d
      LEFT JOIN hotels h ON h.destination_id = d.id
      LEFT JOIN bookings b ON b.hotel_id = h.id
      GROUP BY d.id, d.name ORDER BY booking_count DESC LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(users.rows[0].count),
        totalBookings: parseInt(bookings.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].total),
        totalDestinations: parseInt(destinations.rows[0].count),
        totalHotels: parseInt(hotels.rows[0].count),
        totalAttractions: parseInt(attractions.rows[0].count),
        recentBookings: recentBookings.rows,
        monthlyRevenue: monthlyRevenue.rows,
        topDestinations: topDestinations.rows,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
