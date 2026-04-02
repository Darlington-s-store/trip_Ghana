const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const adminBookingsController = require('../../controllers/adminBookingsController');

router.use(authenticateToken, requireAdmin);

router.get('/', adminBookingsController.getAllBookings);
router.get('/stats', adminBookingsController.getBookingStats);
router.get('/by-date', adminBookingsController.getBookingsByDateRange);
router.get('/:bookingId', adminBookingsController.getBooking);
router.put('/:bookingId/confirm', adminBookingsController.confirmBooking);
router.put('/:bookingId/cancel', adminBookingsController.cancelBooking);

module.exports = router;
