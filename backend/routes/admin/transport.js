const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const adminTransportController = require('../../controllers/adminTransportController');

router.use(authenticateToken, requireAdmin);

router.get('/', adminTransportController.getAllRoutes);
router.post('/', adminTransportController.createRoute);
router.get('/locations', adminTransportController.getLocations);
router.get('/stats', adminTransportController.getTransportStats);
router.get('/:routeId', adminTransportController.getRoute);
router.put('/:routeId', adminTransportController.updateRoute);
router.delete('/:routeId', adminTransportController.deleteRoute);

module.exports = router;
