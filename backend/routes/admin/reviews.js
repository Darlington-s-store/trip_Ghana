const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const adminReviewsController = require('../../controllers/adminReviewsController');

router.use(authenticateToken, requireAdmin);

router.get('/', adminReviewsController.getAllReviews);
router.get('/pending', adminReviewsController.getPendingReviews);
router.get('/stats', adminReviewsController.getReviewStats);
router.get('/:reviewId', adminReviewsController.getReview);
router.put('/:reviewId/approve', adminReviewsController.approveReview);
router.put('/:reviewId/reject', adminReviewsController.rejectReview);
router.patch('/:reviewId/featured', adminReviewsController.toggleFeatured);
router.delete('/:reviewId', adminReviewsController.deleteReview);

module.exports = router;
