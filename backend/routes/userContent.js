const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userContentController = require('../controllers/userContentController');

/**
 * Public routes (no authentication required)
 */

// Get all destinations with pagination/search
router.get('/destinations', userContentController.getDestinations);

// Get destination details
router.get('/destinations/:slug', userContentController.getDestinationDetail);

// Get hotels with filters
router.get('/hotels', userContentController.getHotels);

// Get hotel details
router.get('/hotels/:hotelId', userContentController.getHotelDetail);

// Get attractions
router.get('/attractions', userContentController.getAttractions);

// Get transport routes
router.get('/transport/routes', userContentController.getTransportRoutes);

// Get transport locations for search
router.get('/transport/locations', userContentController.getTransportLocations);

/**
 * Protected routes (authentication required)
 */

// Get user's trips
router.get('/my-trips', authenticateToken, userContentController.getUserTrips);

// Get user's bookings
router.get('/my-bookings', authenticateToken, userContentController.getUserBookings);

// Submit new attraction
router.post('/attractions/submit', authenticateToken, userContentController.submitAttraction);

// Submit review
router.post('/reviews/submit', authenticateToken, userContentController.submitReview);

module.exports = router;
