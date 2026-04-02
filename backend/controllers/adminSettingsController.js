const pool = require('../db');
const bcrypt = require('bcryptjs');
const { sendNotification, broadcastNotification } = require('./notificationController');

/**
 * Admin Settings Controller
 * Handles system settings, maintenance mode, user management, and security features
 */

class AdminSettingsController {
  // Get system settings (admin only)
  static async getSettings(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const result = await pool.query(
        `SELECT key, value FROM admin_settings WHERE key IN ('maintenance_mode', 'maintenance_message', 'site_alert', 'alert_active')`
      );

      const settings = {};
      result.rows.forEach(row => {
        settings[row.key] = row.value;
      });

      return res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ success: false, message: 'Error fetching settings' });
    }
  }

  // Update maintenance mode
  static async setMaintenanceMode(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { enabled, message } = req.body;

      // Update settings
      await pool.query(
        `INSERT INTO admin_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ['maintenance_mode', enabled ? 'true' : 'false']
      );

      if (message) {
        await pool.query(
          `INSERT INTO admin_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          ['maintenance_message', message]
        );
      }

      // Audit log
      await pool.query(
        'INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip) VALUES ($1, $2, $3, $4, $5)',
        [req.user.userId, 'MAINTENANCE_MODE_' + (enabled ? 'ON' : 'OFF'), 'system', null, req.ip]
      );

      // Broadcast notification to all users
      if (enabled) {
        await broadcastNotification(
          'Scheduled Maintenance',
          message || 'Our website is undergoing scheduled maintenance. Please try again later.',
          'system'
        );
      } else {
        await broadcastNotification(
          'Website Back Online',
          'We are back online! Thank you for your patience.',
          'system'
        );
      }

      return res.json({
        success: true,
        message: 'Maintenance mode updated',
      });
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
      return res.status(500).json({ success: false, message: 'Error updating maintenance mode' });
    }
  }

  // Send site-wide alert
  static async sendSiteAlert(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { title, message, priority = 'info' } = req.body;

      // Validate priority
      if (!['info', 'warning', 'critical'].includes(priority)) {
        return res.status(400).json({ success: false, message: 'Invalid priority level' });
      }

      // Store alert
      await pool.query(
        `INSERT INTO admin_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ['site_alert', JSON.stringify({ title, message, priority, timestamp: new Date() })]
      );

      // Broadcast to all users
      await broadcastNotification(title, message, 'system');

      // Audit log
      await pool.query(
        'INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip) VALUES ($1, $2, $3, $4, $5)',
        [req.user.userId, 'SITE_ALERT_SENT', 'system', null, req.ip]
      );

      return res.json({
        success: true,
        message: 'Alert sent to all users',
      });
    } catch (error) {
      console.error('Error sending alert:', error);
      return res.status(500).json({ success: false, message: 'Error sending alert' });
    }
  }

  // Get all users (admin only)
  static async getAllUsers(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { role, status, limit = 20, offset = 0 } = req.query;

      let query = 'SELECT id, email, first_name, last_name, phone, role, status, email_verified, created_at FROM users WHERE 1=1';
      const params = [];

      if (role) {
        query += ' AND role = $' + (params.length + 1);
        params.push(role);
      }

      if (status) {
        query += ' AND status = $' + (params.length + 1);
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      return res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ success: false, message: 'Error fetching users' });
    }
  }

  // Get user details (admin only)
  static async getUserDetails(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { userId } = req.params;

      const result = await pool.query(
        'SELECT id, email, first_name, last_name, phone, role, status, email_verified, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      return res.status(500).json({ success: false, message: 'Error fetching user details' });
    }
  }

  // Admin reset user password
  static async resetUserPassword(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { userId } = req.params;
      const { newPassword } = req.body;

      // Validate password strength
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }

      const userCheck = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

      // Audit log
      await pool.query(
        'INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip) VALUES ($1, $2, $3, $4, $5)',
        [req.user.userId, 'USER_PASSWORD_RESET', 'user', userId, req.ip]
      );

      // Notify user
      await sendNotification(userId, 'Password Reset', 'Your password has been reset by an administrator', 'system');

      return res.json({
        success: true,
        message: 'User password reset successfully',
      });
    } catch (error) {
      console.error('Error resetting user password:', error);
      return res.status(500).json({ success: false, message: 'Error resetting password' });
    }
  }

  // Suspend/Block user
  static async suspendUser(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { userId } = req.params;
      const { reason } = req.body;

      const userCheck = await pool.query('SELECT email, status FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (userCheck.rows[0].status === 'suspended') {
        return res.status(400).json({ success: false, message: 'User is already suspended' });
      }

      // Update user status
      await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['suspended', userId]);

      // Audit log
      await pool.query(
        'INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip) VALUES ($1, $2, $3, $4, $5)',
        [req.user.userId, 'USER_SUSPENDED', 'user', userId, req.ip]
      );

      // Notify user
      await sendNotification(userId, 'Account Suspended', `Your account has been suspended. Reason: ${reason || 'Not specified'}`, 'system');

      return res.json({
        success: true,
        message: 'User suspended',
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      return res.status(500).json({ success: false, message: 'Error suspending user' });
    }
  }

  // Activate/Unsuspend user
  static async activateUser(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { userId } = req.params;

      const userCheck = await pool.query('SELECT email, status FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Update user status
      await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['active', userId]);

      // Audit log
      await pool.query(
        'INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip) VALUES ($1, $2, $3, $4, $5)',
        [req.user.userId, 'USER_ACTIVATED', 'user', userId, req.ip]
      );

      // Notify user
      await sendNotification(userId, 'Account Activated', 'Your account has been activated', 'system');

      return res.json({
        success: true,
        message: 'User activated',
      });
    } catch (error) {
      console.error('Error activating user:', error);
      return res.status(500).json({ success: false, message: 'Error activating user' });
    }
  }

  // Get audit logs (admin only)
  static async getAuditLogs(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { limit = 50, offset = 0, action, actor_id } = req.query;

      let query = 'SELECT al.id, al.actor_id, al.action, al.resource_type, al.resource_id, al.ip, al.created_at, u.email as actor_email FROM audit_logs al LEFT JOIN users u ON al.actor_id = u.id WHERE 1=1';
      const params = [];

      if (action) {
        query += ' AND al.action = $' + (params.length + 1);
        params.push(action);
      }

      if (actor_id) {
        query += ' AND al.actor_id = $' + (params.length + 1);
        params.push(actor_id);
      }

      query += ' ORDER BY al.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      return res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return res.status(500).json({ success: false, message: 'Error fetching audit logs' });
    }
  }
}

module.exports = AdminSettingsController;
