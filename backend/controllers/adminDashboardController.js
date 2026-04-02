const pool = require('../db');

class AdminDashboardController {
  async getDashboardStats(req, res) {
    try {
      const stats = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM users'),
        pool.query('SELECT COUNT(*) as count FROM bookings'),
        pool.query('SELECT COUNT(*) as count FROM trips WHERE status = "pending_approval"'),
        pool.query('SELECT SUM(total_price) as total FROM bookings WHERE status = "confirmed"'),
      ]);

      res.json({
        success: true,
        data: {
          totalUsers: parseInt(stats[0].rows[0].count),
          totalBookings: parseInt(stats[1].rows[0].count),
          pendingTrips: parseInt(stats[2].rows[0].count),
          totalRevenue: parseFloat(stats[3].rows[0].total || 0),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRecentActivity(req, res) {
    try {
      const result = await pool.query(
        `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20`
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AdminDashboardController();
