const pool = require('../db');

class BookingController {
  async createBooking(req, res) {
    const { type, targetId, checkIn, checkOut, guests, totalPrice, currency } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
      const result = await pool.query(
        `INSERT INTO bookings (user_id, type, target_id, check_in, check_out, guests, total_price, currency, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
        [userId, type, targetId, checkIn, checkOut, guests || 1, totalPrice, currency || 'GHS']
      );

      // Create notification
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, channel) VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'Booking Created', `Your ${type} booking has been created and is pending confirmation.`, 'booking', 'in-app']
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyBookings(req, res) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
      const result = await pool.query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async cancelBooking(req, res) {
    const { bookingId } = req.params;
    const userId = req.user?.userId;

    try {
      const result = await pool.query(
        `UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2 RETURNING *`,
        [bookingId, userId]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
      res.json({ success: true, message: 'Booking cancelled', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new BookingController();
