const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Initialize payment - creates a booking and returns reference for Paystack
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const { hotel_id, room_type, check_in, check_out, guests, total_price, currency } = req.body;

    // Create booking in pending state
    const result = await pool.query(
      `INSERT INTO bookings (user_id, hotel_id, room_type, check_in, check_out, guests, total_price, currency, status, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending','unpaid') RETURNING *`,
      [req.user.userId, hotel_id, room_type, check_in, check_out, guests, total_price, currency || 'GHS']
    );

    const booking = result.rows[0];

    // Get user email for Paystack
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);

    res.json({
      success: true,
      data: {
        booking,
        paystack: {
          reference: `GT-${booking.id.substring(0, 8)}-${Date.now()}`,
          email: userResult.rows[0].email,
          amount: Math.round(total_price * 100), // Paystack expects amount in pesewas/kobo
          currency: currency === 'USD' ? 'USD' : 'GHS',
        }
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Verify payment - called after Paystack popup success
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { booking_id, reference } = req.body;

    // In production, verify with Paystack API using PAYSTACK_SECRET_KEY
    // const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    //   headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    // });

    // For now, mark as paid
    const result = await pool.query(
      "UPDATE bookings SET payment_status='paid', status='confirmed' WHERE id=$1 AND user_id=$2 RETURNING *",
      [booking_id, req.user.userId]
    );

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Create notification
    await pool.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES ($1, 'Booking Confirmed', $2, 'booking')",
      [req.user.userId, `Your booking has been confirmed. Reference: ${reference}`]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
