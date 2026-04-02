const crypto = require('crypto');
const axios = require('axios');
const prisma = require('../lib/prisma');
const { sendEmail } = require('../utils/email');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

/**
 * Initialize payment
 */
exports.initializePayment = async (req, res) => {
  try {
    const { bookingId, email, amount, currency = 'GHS' } = req.body;

    if (!bookingId || !email || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID, email, and amount are required',
      });
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { bookingId },
    });

    if (existingPayment && existingPayment.status === 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid',
      });
    }

    // Convert currency if needed
    let amountInGHS = amount;
    let amountInUSD = null;
    if (currency === 'USD') {
      // Convert USD to GHS (using a rate - in production, fetch from API)
      const exchangeRate = 55; // 1 USD = 55 GHS (example)
      amountInGHS = amount * exchangeRate;
      amountInUSD = amount;
    } else {
      // Convert GHS to USD
      const exchangeRate = 55;
      amountInUSD = (amount / exchangeRate).toFixed(2);
    }

    // Initialize payment with Paystack
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email,
          amount: Math.round(amountInGHS * 100), // Paystack uses cents
          metadata: {
            bookingId,
            userId: booking.userId,
            bookingType: booking.type,
            fullName: booking.user.firstName + ' ' + booking.user.lastName,
          },
          currency: 'GHS',
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      // Store payment record
      const payment = await prisma.payment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          userId: booking.userId,
          paystackRef: response.data.data.reference,
          amountGhs: amountInGHS,
          amountUsd: amountInUSD,
          status: 'PENDING',
        },
        update: {
          paystackRef: response.data.data.reference,
          amountGhs: amountInGHS,
          amountUsd: amountInUSD,
          status: 'PENDING',
        },
      });

      res.json({
        success: true,
        data: {
          authorizationUrl: response.data.data.authorization_url,
          accessCode: response.data.data.access_code,
          reference: response.data.data.reference,
          amount: amountInGHS,
          currency: 'GHS',
        },
      });
    } catch (error) {
      console.error('[paystackController] Paystack API error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize payment: ' + error.message,
      });
    }
  } catch (error) {
    console.error('[paystackController] Initialize payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify payment
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required',
      });
    }

    // Verify with Paystack
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      const paystackPayment = response.data.data;

      // Update payment record
      const payment = await prisma.payment.findUnique({
        where: { paystackRef: reference },
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paystackPayment.status === 'success' ? 'SUCCESS' : paystackPayment.status === 'failed' ? 'FAILED' : 'PENDING',
        },
        include: { booking: true },
      });

      // If payment successful, update booking status
      if (updatedPayment.status === 'SUCCESS') {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        });

        // Send confirmation email
        const booking = await prisma.booking.findUnique({
          where: { id: payment.bookingId },
          include: { user: true },
        });

        await sendEmail({
          to: booking.user.email,
          subject: 'Payment Confirmed',
          template: 'booking-confirmation',
          data: {
            firstName: booking.user.firstName,
            bookingType: booking.type,
            reference: reference,
            currency: 'GHS',
            amount: updatedPayment.amountGhs,
            date: new Date().toLocaleDateString(),
          },
        }).catch(console.error);

        // Log audit
        await prisma.auditLog.create({
          data: {
            actorId: booking.user.id,
            action: 'PAYMENT_SUCCESS',
            resourceType: 'PAYMENT',
            resourceId: payment.id,
            ip: req.ip,
          },
        });
      }

      res.json({
        success: true,
        data: {
          status: updatedPayment.status,
          reference: reference,
          amount: updatedPayment.amountGhs,
          currency: 'GHS',
          bookingId: payment.bookingId,
        },
      });
    } catch (error) {
      console.error('[paystackController] Paystack verification error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment: ' + error.message,
      });
    }
  } catch (error) {
    console.error('[paystackController] Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Webhook handler for Paystack events
 * Validates webhook with HMAC-SHA512
 */
exports.webhook = async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-paystack-signature'];
    const body = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.warn('[paystackController] Invalid webhook signature');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body;

    // Handle successful payment
    if (event.event === 'charge.success') {
      const payment = await prisma.payment.findUnique({
        where: { paystackRef: event.data.reference },
      });

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      // Update payment and booking
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS' },
      });

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      });

      // Log
      await prisma.auditLog.create({
        data: {
          action: 'WEBHOOK_PAYMENT_SUCCESS',
          resourceType: 'PAYMENT',
          resourceId: payment.id,
          ip: req.ip,
        },
      });
    }

    // Handle failed payment
    if (event.event === 'charge.failed') {
      const payment = await prisma.payment.findUnique({
        where: { paystackRef: event.data.reference },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[paystackController] Webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get payment details
 */
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('[paystackController] Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Initiate refund
 */
exports.initiateRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Refund reason is required',
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: { include: { user: true } } },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status !== 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: 'Only successful payments can be refunded',
      });
    }

    // Call Paystack refund API
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/refund`,
        {
          transaction: payment.paystackRef,
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REVERSED' },
      });

      // Log refund
      await prisma.auditLog.create({
        data: {
          actorId: req.user.userId,
          action: 'REFUND_INITIATED',
          resourceType: 'PAYMENT',
          resourceId: paymentId,
          ip: req.ip,
        },
      });

      // Notify user
      await sendEmail({
        to: payment.booking.user.email,
        subject: 'Refund Processed',
        html: `<p>Hi ${payment.booking.user.firstName},</p>
               <p>Your refund of GHS ${payment.amountGhs} has been processed.</p>
               <p>Reason: ${reason}</p>
               <p>Best regards, GhanaTravel Team</p>`,
      }).catch(console.error);

      res.json({
        success: true,
        message: 'Refund initiated successfully',
        data: updatedPayment,
      });
    } catch (error) {
      console.error('[paystackController] Paystack refund error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate refund: ' + error.message,
      });
    }
  } catch (error) {
    console.error('[paystackController] Initiate refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
