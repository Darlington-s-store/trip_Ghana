const pool = require('../db');

/**
 * Notification Controller
 * Handles all notification operations with security checks
 */

class NotificationController {
  // Get all notifications for user
  static async getNotifications(req, res) {
    try {
      const { userId } = req.user;
      const { limit = 20, offset = 0, unread_only = false } = req.query;

      let query = 'SELECT id, title, message, type, channel, read, created_at FROM notifications WHERE user_id = $1';
      const params = [userId];

      if (unread_only === 'true') {
        query += ' AND read = false';
      }

      query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      return res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
  }

  // Get unread notification count
  static async getUnreadCount(req, res) {
    try {
      const { userId } = req.user;

      const result = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
        [userId]
      );

      return res.json({
        success: true,
        unread_count: parseInt(result.rows[0].count),
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return res.status(500).json({ success: false, message: 'Error fetching unread count' });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { userId } = req.user;
      const { notificationId } = req.params;

      const result = await pool.query(
        'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING id',
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      return res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
      console.error('Error marking as read:', error);
      return res.status(500).json({ success: false, message: 'Error marking as read' });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const { userId } = req.user;

      await pool.query(
        'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
        [userId]
      );

      return res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
      console.error('Error marking all as read:', error);
      return res.status(500).json({ success: false, message: 'Error marking all as read' });
    }
  }

  // Delete notification
  static async deleteNotification(req, res) {
    try {
      const { userId } = req.user;
      const { notificationId } = req.params;

      const result = await pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      return res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ success: false, message: 'Error deleting notification' });
    }
  }
}

/**
 * Helper function to send notifications
 * Used by other controllers when events occur
 */
async function sendNotification(userId, title, message, type, channel = 'in-app') {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, channel) VALUES ($1, $2, $3, $4, $5)',
      [userId, title, message, type, channel]
    );
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Broadcast notification to all users (system/maintenance alerts)
 */
async function broadcastNotification(title, message, type = 'system') {
  try {
    // Get all active users
    const users = await pool.query('SELECT id FROM users WHERE status = $1', ['active']);

    // Send to each user
    for (const user of users.rows) {
      await sendNotification(user.id, title, message, type, 'both');
    }
  } catch (error) {
    console.error('Error broadcasting notification:', error);
  }
}

module.exports = {
  NotificationController,
  sendNotification,
  broadcastNotification,
};
