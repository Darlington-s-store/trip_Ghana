const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const adminAttractionsController = require('../../controllers/adminAttractionsController');

router.use(authenticateToken, requireAdmin);

router.get('/', adminAttractionsController.getAllAttractions);
router.post('/', adminAttractionsController.createAttraction);
router.get('/pending', adminAttractionsController.getPendingAttractions);
router.get('/:attractionId', adminAttractionsController.getAttraction);
router.put('/:attractionId', adminAttractionsController.updateAttraction);
router.put('/:attractionId/approve', adminAttractionsController.approveAttraction);
router.put('/:attractionId/reject', adminAttractionsController.rejectAttraction);
router.delete('/:attractionId', adminAttractionsController.deleteAttraction);

module.exports = router;
