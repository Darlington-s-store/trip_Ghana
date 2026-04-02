const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const paystackController = require('../controllers/paystackController');

/**
 * Public route for webhook (no auth required)
 */
router.post('/webhook/paystack', paystackController.webhook);

/**
 * Protected routes
 */

// Initialize payment
router.post('/initialize', authenticateToken, paystackController.initializePayment);

// Verify payment
router.get('/verify/:reference', authenticateToken, paystackController.verifyPayment);

// Get payment details
router.get('/:paymentId', authenticateToken, paystackController.getPaymentDetails);

// Initiate refund (admin only - but allowing authenticated users for now)
router.post('/:paymentId/refund', authenticateToken, paystackController.initiateRefund);

module.exports = router;
