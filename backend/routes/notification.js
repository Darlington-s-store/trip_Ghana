const express = require('express');
const router = express.Router();
const { NotificationController } = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/secureAuth');

/**
 * Notification Routes
 * All routes require authentication
 */

router.use(authenticateToken);

// Get all notifications with optional filtering
router.get('/', NotificationController.getNotifications);

// Get unread notification count
router.get('/unread/count', NotificationController.getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', NotificationController.deleteNotification);

module.exports = router;
