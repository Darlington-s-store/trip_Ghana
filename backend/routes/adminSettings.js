const express = require('express');
const router = express.Router();
const AdminSettingsController = require('../controllers/adminSettingsController');
const { authenticateToken } = require('../middleware/secureAuth');
const { csrfProtection, sanitizeInput } = require('../middleware/securityMiddleware');

/**
 * Admin Settings Routes
 * All routes require authentication and admin role
 */

router.use(authenticateToken);
router.use(sanitizeInput);

// Settings management
router.get('/settings', AdminSettingsController.getSettings);
router.post('/maintenance-mode', csrfProtection, AdminSettingsController.setMaintenanceMode);
router.post('/alerts/send', csrfProtection, AdminSettingsController.sendSiteAlert);

// User management
router.get('/users', AdminSettingsController.getAllUsers);
router.get('/users/:userId', AdminSettingsController.getUserDetails);
router.post('/users/:userId/reset-password', csrfProtection, AdminSettingsController.resetUserPassword);
router.post('/users/:userId/suspend', csrfProtection, AdminSettingsController.suspendUser);
router.post('/users/:userId/activate', csrfProtection, AdminSettingsController.activateUser);

// Audit logs
router.get('/audit-logs', AdminSettingsController.getAuditLogs);

module.exports = router;
