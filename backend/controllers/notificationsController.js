const prisma = require('../lib/prisma');

const notificationsController = {
  // Get all notifications for user
  getNotifications: async (req, res) => {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const userId = req.user.userId;

      const skip = (page - 1) * limit;
      const where = { userId };
      if (unreadOnly === 'true') where.isRead = false;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.notification.count({ where }),
      ]);

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single notification
  getNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.userId;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      // Check ownership
      if (notification.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Mark as read
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.userId;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.userId !== userId) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.userId;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Delete notification
  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.userId;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.userId !== userId) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get unread count
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.userId;

      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      res.json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get notification preferences
  getPreferences: async (req, res) => {
    try {
      const userId = req.user.userId;

      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!preferences) {
        // Create default preferences
        const created = await prisma.notificationPreference.create({
          data: {
            userId,
            emailBookingConfirmation: true,
            emailPaymentAlert: true,
            emailMarketingUpdates: false,
            emailTripRecommendations: true,
            smsBookingConfirmation: true,
            smsPaymentAlert: true,
            pushNotifications: true,
          },
        });
        return res.json({ success: true, data: created });
      }

      res.json({ success: true, data: preferences });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update notification preferences
  updatePreferences: async (req, res) => {
    try {
      const userId = req.user.userId;
      const updates = req.body;

      const preferences = await prisma.notificationPreference.upsert({
        where: { userId },
        update: updates,
        create: {
          userId,
          ...updates,
        },
      });

      res.json({ success: true, data: preferences });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get notification stats (for dashboard)
  getStats: async (req, res) => {
    try {
      const userId = req.user.userId;

      const [total, unread, byType] = await Promise.all([
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { userId },
          _count: true,
        }),
      ]);

      const stats = {
        total,
        unread,
        byType: Object.fromEntries(
          byType.map(item => [item.type, item._count])
        ),
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = notificationsController;
