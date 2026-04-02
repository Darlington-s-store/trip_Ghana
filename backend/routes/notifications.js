const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

/**
 * All routes require authentication
 */
router.use(authenticateToken);

// Get all notifications with pagination
router.get('/', notificationsController.getNotifications);

// Get notification stats
router.get('/stats', notificationsController.getStats);

// Get unread count
router.get('/unread-count', notificationsController.getUnreadCount);

// Get single notification and mark as read
router.get('/:notificationId', notificationsController.getNotification);

// Mark notification as read
router.put('/:notificationId/read', notificationsController.markAsRead);

// Mark all as read
router.put('/read-all', notificationsController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notificationsController.deleteNotification);

// Notification preferences
router.get('/preferences/get', notificationsController.getPreferences);
router.put('/preferences/update', notificationsController.updatePreferences);

module.exports = router;
