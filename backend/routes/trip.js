const express = require('express');
const router = express.Router();
const TripController = require('../controllers/tripController');
const { authenticateToken } = require('../middleware/secureAuth');

/**
 * Trip Planning Routes
 * All routes require authentication
 */

router.use(authenticateToken);

// User trips
router.post('/', TripController.createTrip);
router.get('/', TripController.getUserTrips);
router.get('/:tripId', TripController.getTripDetails);
router.put('/:tripId', TripController.updateTrip);
router.post('/:tripId/submit-approval', TripController.submitTripForApproval);

// Admin trip management
router.get('/admin/pending', TripController.getPendingTrips);
router.post('/:tripId/approve', TripController.approveTrip);
router.post('/:tripId/reject', TripController.rejectTrip);

module.exports = router;
