const {
  enqueueEmail,
  enqueueSMS,
  enqueueInAppNotification,
} = require('../queues/notificationQueue');
const emailTemplates = require('../templates/emailTemplates');
const prisma = require('../lib/prisma');

/**
 * Notification helper functions for easy triggering from controllers
 */

const notificationHelpers = {
  // Welcome email
  sendWelcomeEmail: async (email, firstName) => {
    const html = emailTemplates.welcome(firstName, email);
    await enqueueEmail(email, 'Welcome to Ghana Travel Co!', 'welcome', { firstName });
  },

  // Email verification
  sendEmailVerification: async (email, code) => {
    const html = emailTemplates.emailVerification(code, email);
    await enqueueEmail(email, 'Verify Your Email', 'emailVerification', { code });
  },

  // Password reset
  sendPasswordReset: async (email, resetLink) => {
    const html = emailTemplates.passwordReset(resetLink, email);
    await enqueueEmail(email, 'Reset Your Password', 'passwordReset', { resetLink });
  },

  // Booking confirmation
  sendBookingConfirmation: async (email, bookingRef, details) => {
    await enqueueEmail(email, 'Booking Confirmed', 'bookingConfirmation', {
      bookingRef,
      details,
    });
    
    // Also create in-app notification
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) {
      await enqueueInAppNotification(
        user.id,
        'Booking Confirmed',
        `Your booking ${bookingRef} has been confirmed`,
        'booking',
        bookingRef
      );
    }
  },

  // Payment confirmation
  sendPaymentConfirmation: async (email, paymentRef, details) => {
    await enqueueEmail(email, 'Payment Confirmed', 'paymentConfirmation', {
      paymentRef,
      details,
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) {
      await enqueueInAppNotification(
        user.id,
        'Payment Successful',
        `Payment ${paymentRef} of ${details.currency} ${details.amount} confirmed`,
        'payment',
        paymentRef
      );
    }
  },

  // Trip approved
  sendTripApprovedEmail: async (email, tripName, tripId) => {
    await enqueueEmail(email, 'Your Trip Has Been Approved!', 'tripApproved', {
      tripName,
      tripId,
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) {
      await enqueueInAppNotification(
        user.id,
        'Trip Approved',
        `Your trip "${tripName}" has been approved and is now live!`,
        'trip',
        tripId
      );
    }
  },

  // Trip rejected
  sendTripRejectedEmail: async (email, tripName, reason) => {
    await enqueueEmail(email, 'Trip Review Update', 'tripRejected', {
      tripName,
      reason,
    });
  },

  // Attraction approved
  sendAttractionApprovedEmail: async (email, attractionName) => {
    await enqueueEmail(email, 'Attraction Approved!', 'attractionApproved', {
      attractionName,
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) {
      await enqueueInAppNotification(
        user.id,
        'Attraction Approved',
        `Your attraction "${attractionName}" has been approved!`,
        'attraction'
      );
    }
  },

  // Attraction rejected
  sendAttractionRejectedEmail: async (email, attractionName, reason) => {
    await enqueueEmail(email, 'Attraction Review Update', 'attractionRejected', {
      attractionName,
      reason,
    });
  },

  // New review notification for business
  sendNewReviewNotification: async (businessEmail, businessName, rating, comment) => {
    await enqueueEmail(businessEmail, `New Review on ${businessName}`, 'newReview', {
      businessName,
      rating,
      comment,
    });
  },

  // Pending approvals digest for admin
  sendPendingApprovalsEmail: async (adminEmail, counts) => {
    await enqueueEmail(adminEmail, 'Pending Approvals Dashboard', 'pendingApprovalsAdmin', {
      counts,
    });
  },

  // Booking cancellation
  sendBookingCancelledEmail: async (email, bookingRef, refundAmount) => {
    await enqueueEmail(email, 'Booking Cancelled', 'bookingCancelled', {
      bookingRef,
      refundAmount,
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) {
      await enqueueInAppNotification(
        user.id,
        'Booking Cancelled',
        `Your booking ${bookingRef} has been cancelled. Refund: ${refundAmount}`,
        'booking_cancelled',
        bookingRef
      );
    }
  },

  // SMS notifications
  sendBookingConfirmationSMS: async (phoneNumber, bookingRef) => {
    await enqueueSMS(phoneNumber, `Your Ghana Travel booking ${bookingRef} is confirmed! View details at [URL]`);
  },

  sendPaymentConfirmationSMS: async (phoneNumber, amount, bookingRef) => {
    await enqueueSMS(phoneNumber, `Payment of ${amount} confirmed for booking ${bookingRef}. Thank you for booking with Ghana Travel Co!`);
  },

  sendPasswordResetSMS: async (phoneNumber, code) => {
    await enqueueSMS(phoneNumber, `Your password reset code is: ${code}. Valid for 1 hour.`);
  },

  // Bulk in-app notifications to admins
  notifyAdminsOfPendingApprovals: async (counts) => {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await enqueueInAppNotification(
        admin.id,
        'Pending Approvals',
        `You have ${counts.trips} trips, ${counts.attractions} attractions, and ${counts.reviews} reviews pending review`,
        'admin_alert'
      );
    }
  },

  // Generic in-app notification
  notifyUser: async (userId, title, message, type, relatedId = null) => {
    await enqueueInAppNotification(userId, title, message, type, relatedId);
  },

  // Notify multiple users
  notifyUsers: async (userIds, title, message, type) => {
    for (const userId of userIds) {
      await enqueueInAppNotification(userId, title, message, type);
    }
  },
};

module.exports = notificationHelpers;
