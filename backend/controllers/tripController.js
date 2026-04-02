const pool = require('../db');
const { sendNotification } = require('./notificationController');

/**
 * Trip Planning Controller
 * Handles trip creation, submission, approval workflow
 */

class TripController {
  // Create or draft a trip
  static async createTrip(req, res) {
    try {
      const { userId } = req.user;
      const { name, start_date, end_date, destinations, transport, side_attractions, activities, budget, currency, notes } = req.body;

      // Validate dates
      if (new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({ success: false, message: 'End date must be after start date' });
      }

      const result = await pool.query(
        `INSERT INTO trips (user_id, name, start_date, end_date, destinations, transport, side_attractions, activities, budget, currency, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, status, created_at`,
        [userId, name, start_date, end_date, JSON.stringify(destinations), transport, side_attractions, activities, budget, currency, notes, 'draft']
      );

      const tripId = result.rows[0].id;

      // Send notification to user
      await sendNotification(userId, 'Trip Created', `Your trip "${name}" has been created as draft`, 'trip');

      return res.json({
        success: true,
        message: 'Trip created successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error creating trip:', error);
      return res.status(500).json({ success: false, message: 'Error creating trip' });
    }
  }

  // Get user's trips
  static async getUserTrips(req, res) {
    try {
      const { userId } = req.user;
      const { status, limit = 20, offset = 0 } = req.query;

      let query = 'SELECT id, name, start_date, end_date, status, budget, currency, created_at FROM trips WHERE user_id = $1';
      const params = [userId];

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
      console.error('Error fetching user trips:', error);
      return res.status(500).json({ success: false, message: 'Error fetching trips' });
    }
  }

  // Get trip details
  static async getTripDetails(req, res) {
    try {
      const { userId } = req.user;
      const { tripId } = req.params;

      const result = await pool.query(
        `SELECT id, user_id, name, start_date, end_date, destinations, transport, side_attractions, activities, budget, currency, status, rejection_reason, notes, created_at
         FROM trips WHERE id = $1 AND user_id = $2`,
        [tripId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching trip details:', error);
      return res.status(500).json({ success: false, message: 'Error fetching trip' });
    }
  }

  // Update trip (draft/pending status only)
  static async updateTrip(req, res) {
    try {
      const { userId } = req.user;
      const { tripId } = req.params;
      const { name, start_date, end_date, destinations, transport, side_attractions, activities, budget, currency, notes } = req.body;

      // Check trip exists and belongs to user
      const tripCheck = await pool.query('SELECT status FROM trips WHERE id = $1 AND user_id = $2', [tripId, userId]);
      
      if (tripCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      if (!['draft', 'pending_approval'].includes(tripCheck.rows[0].status)) {
        return res.status(400).json({ success: false, message: 'Cannot update approved/rejected trips' });
      }

      const result = await pool.query(
        `UPDATE trips SET name = $1, start_date = $2, end_date = $3, destinations = $4, transport = $5, side_attractions = $6, activities = $7, budget = $8, currency = $9, notes = $10
         WHERE id = $11 AND user_id = $12
         RETURNING id, status, updated_at`,
        [name, start_date, end_date, JSON.stringify(destinations), transport, side_attractions, activities, budget, currency, notes, tripId, userId]
      );

      return res.json({
        success: true,
        message: 'Trip updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error updating trip:', error);
      return res.status(500).json({ success: false, message: 'Error updating trip' });
    }
  }

  // Submit trip for approval
  static async submitTripForApproval(req, res) {
    try {
      const { userId } = req.user;
      const { tripId } = req.params;

      const tripCheck = await pool.query('SELECT status, name FROM trips WHERE id = $1 AND user_id = $2', [tripId, userId]);
      
      if (tripCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      if (tripCheck.rows[0].status !== 'draft') {
        return res.status(400).json({ success: false, message: 'Only draft trips can be submitted for approval' });
      }

      const result = await pool.query(
        'UPDATE trips SET status = $1 WHERE id = $2 RETURNING id, status',
        ['pending_approval', tripId]
      );

      // Notify user
      await sendNotification(userId, 'Trip Submitted', `Your trip "${tripCheck.rows[0].name}" has been submitted for approval`, 'trip');

      // Notify admins (all users with admin role)
      const admins = await pool.query('SELECT id FROM users WHERE role = $1', ['admin']);
      for (const admin of admins.rows) {
        await sendNotification(admin.id, 'New Trip Pending Approval', `Trip "${tripCheck.rows[0].name}" from user awaits approval`, 'trip');
      }

      return res.json({
        success: true,
        message: 'Trip submitted for approval',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error submitting trip:', error);
      return res.status(500).json({ success: false, message: 'Error submitting trip' });
    }
  }

  // Get pending trips (admin only)
  static async getPendingTrips(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { limit = 20, offset = 0 } = req.query;

      const result = await pool.query(
        `SELECT t.id, t.name, t.start_date, t.end_date, t.status, t.budget, t.currency, t.created_at, u.first_name, u.last_name, u.email
         FROM trips t
         JOIN users u ON t.user_id = u.id
         WHERE t.status = $1
         ORDER BY t.created_at DESC
         LIMIT $2 OFFSET $3`,
        ['pending_approval', parseInt(limit), parseInt(offset)]
      );

      return res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching pending trips:', error);
      return res.status(500).json({ success: false, message: 'Error fetching pending trips' });
    }
  }

  // Admin approve trip
  static async approveTrip(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { tripId } = req.params;

      const tripCheck = await pool.query('SELECT user_id, name FROM trips WHERE id = $1 AND status = $2', [tripId, 'pending_approval']);
      
      if (tripCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Trip not found or not pending' });
      }

      const userId = tripCheck.rows[0].user_id;
      const tripName = tripCheck.rows[0].name;

      const result = await pool.query(
        'UPDATE trips SET status = $1 WHERE id = $2 RETURNING id, status',
        ['approved', tripId]
      );

      // Audit log
      await pool.query(
        'INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip) VALUES ($1, $2, $3, $4, $5)',
        [req.user.userId, 'TRIP_APPROVED', 'trip', tripId, req.ip]
      );

      // Notify user
      await sendNotification(userId, 'Trip Approved', `Your trip "${tripName}" has been approved!`, 'trip');

      return res.json({
        success: true,
        message: 'Trip approved',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error approving trip:', error);
      return res.status(500).json({ success: false, message: 'Error approving trip' });
    }
  }

  // Admin reject trip
  static async rejectTrip(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { tripId } = req.params;
      const { rejection_reason } = req.body;

      const tripCheck = await pool.query('SELECT user_id, name FROM trips WHERE id = $1 AND status = $2', [tripId, 'pending_approval']);
      
      if (tripCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Trip not found or not pending' });
      }

      const userId = tripCheck.rows[0].user_id;
      const tripName = tripCheck.rows[0].name;

      const result = await pool.query(
        'UPDATE trips SET status = $1, rejection_reason = $2 WHERE id = $3 RETURNING id, status',
        ['rejected', rejection_reason, tripId]
      );

      // Audit log
      await pool.query(
        'INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip) VALUES ($1, $2, $3, $4, $5)',
        [req.user.userId, 'TRIP_REJECTED', 'trip', tripId, req.ip]
      );

      // Notify user
      await sendNotification(userId, 'Trip Rejected', `Your trip "${tripName}" was rejected. Reason: ${rejection_reason}`, 'trip');

      return res.json({
        success: true,
        message: 'Trip rejected',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error rejecting trip:', error);
      return res.status(500).json({ success: false, message: 'Error rejecting trip' });
    }
  }
}

module.exports = TripController;
