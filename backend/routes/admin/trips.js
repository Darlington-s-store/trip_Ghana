const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const adminTripsController = require('../../controllers/adminTripsController');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Get all trips
router.get('/', adminTripsController.getAllTrips);

// Get trip statistics
router.get('/stats', adminTripsController.getTripStats);

// Get trip details
router.get('/:tripId', adminTripsController.getTrip);

// Approve trip
router.put('/:tripId/approve', adminTripsController.approveTrip);

// Reject trip
router.put('/:tripId/reject', adminTripsController.rejectTrip);

// Delete trip
router.delete('/:tripId', adminTripsController.deleteTrip);

module.exports = router;
