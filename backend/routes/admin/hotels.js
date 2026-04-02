const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const adminHotelsController = require('../../controllers/adminHotelsController');

router.use(authenticateToken, requireAdmin);

router.get('/', adminHotelsController.getAllHotels);
router.post('/', adminHotelsController.createHotel);
router.get('/:hotelId', adminHotelsController.getHotel);
router.put('/:hotelId', adminHotelsController.updateHotel);
router.delete('/:hotelId', adminHotelsController.deleteHotel);

// Room types
router.post('/:hotelId/rooms', adminHotelsController.createRoomType);
router.put('/:hotelId/rooms/:roomTypeId', adminHotelsController.updateRoomType);
router.delete('/:hotelId/rooms/:roomTypeId', adminHotelsController.deleteRoomType);

module.exports = router;
