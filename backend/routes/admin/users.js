const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const adminUsersController = require('../../controllers/adminUsersController');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Get all users
router.get('/', adminUsersController.getAllUsers);

// Get user statistics
router.get('/stats', adminUsersController.getUserStats);

// Get single user details
router.get('/:userId', adminUsersController.getUser);

// Suspend user
router.put('/:userId/suspend', adminUsersController.suspendUser);

// Activate user
router.put('/:userId/activate', adminUsersController.activateUser);

// Reset user password
router.post('/:userId/reset-password', adminUsersController.resetUserPassword);

// Delete user (soft delete)
router.delete('/:userId', adminUsersController.deleteUser);

module.exports = router;
