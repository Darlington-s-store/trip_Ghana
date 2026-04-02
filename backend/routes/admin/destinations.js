const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const adminDestinationsController = require('../../controllers/adminDestinationsController');

router.use(authenticateToken, requireAdmin);

router.get('/', adminDestinationsController.getAllDestinations);
router.post('/', adminDestinationsController.createDestination);
router.get('/:destinationId', adminDestinationsController.getDestination);
router.put('/:destinationId', adminDestinationsController.updateDestination);
router.patch('/:destinationId/visibility', adminDestinationsController.toggleVisibility);
router.delete('/:destinationId', adminDestinationsController.deleteDestination);

module.exports = router;
