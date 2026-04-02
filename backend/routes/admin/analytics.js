const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const adminAnalyticsController = require('../../controllers/adminAnalyticsController');

router.use(authenticateToken, requireAdmin);

router.get('/overview', adminAnalyticsController.getDashboardOverview);
router.get('/revenue', adminAnalyticsController.getRevenueAnalytics);
router.get('/users', adminAnalyticsController.getUserGrowthAnalytics);
router.get('/bookings', adminAnalyticsController.getBookingAnalytics);
router.get('/trips', adminAnalyticsController.getTripAnalytics);
router.get('/audit-logs', adminAnalyticsController.getAuditLogSummary);
router.get('/top-performers', adminAnalyticsController.getTopPerformers);

module.exports = router;
