const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

// Mount admin sub-routers
router.use('/users', require('./users'));
router.use('/trips', require('./trips'));
router.use('/destinations', require('./destinations'));
router.use('/hotels', require('./hotels'));
router.use('/transport', require('./transport'));
router.use('/attractions', require('./attractions'));
router.use('/bookings', require('./bookings'));
router.use('/reviews', require('./reviews'));
router.use('/analytics', require('./analytics'));

module.exports = router;
