// Email HTML templates for various notifications

const emailTemplates = {
  // Welcome email for new registrations
  welcome: (firstName, email) => `
    <h2>Welcome to Ghana Travel Co!</h2>
    <p>Hello ${firstName},</p>
    <p>Thank you for signing up! We're excited to have you on our platform.</p>
    <p>You can now browse amazing trips and experiences across Ghana.</p>
    <p><a href="${process.env.FRONTEND_URL}/explore" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Exploring</a></p>
    <p>If you have any questions, feel free to contact us at support@ghanatravel.co</p>
    <p>Best regards,<br/>Ghana Travel Co Team</p>
  `,

  // Email verification
  emailVerification: (code, email) => `
    <h2>Verify Your Email</h2>
    <p>Your email verification code is:</p>
    <h1 style="font-size: 32px; letter-spacing: 5px; color: #007bff;">${code}</h1>
    <p>This code will expire in 24 hours.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `,

  // Password reset
  passwordReset: (resetLink, email) => `
    <h2>Reset Your Password</h2>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <p><a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `,

  // Booking confirmation
  bookingConfirmation: (bookingRef, details) => `
    <h2>Booking Confirmation</h2>
    <p>Your booking has been confirmed!</p>
    <p><strong>Booking Reference:</strong> ${bookingRef}</p>
    <p><strong>Trip:</strong> ${details.tripName}</p>
    <p><strong>Dates:</strong> ${details.startDate} to ${details.endDate}</p>
    <p><strong>Guests:</strong> ${details.guestCount}</p>
    <p><strong>Total Amount:</strong> ${details.currency} ${details.amount}</p>
    <p><a href="${process.env.FRONTEND_URL}/bookings/${bookingRef}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Booking Details</a></p>
    <p>Thank you for booking with us!</p>
  `,

  // Payment confirmation
  paymentConfirmation: (paymentRef, details) => `
    <h2>Payment Confirmed</h2>
    <p>Your payment has been successfully processed.</p>
    <p><strong>Payment Reference:</strong> ${paymentRef}</p>
    <p><strong>Amount:</strong> ${details.currency} ${details.amount}</p>
    <p><strong>Booking Reference:</strong> ${details.bookingRef}</p>
    <p><strong>Date:</strong> ${new Date(details.timestamp).toLocaleDateString()}</p>
    <p>Your booking is now confirmed. Look forward to an amazing experience!</p>
    <p><a href="${process.env.FRONTEND_URL}/bookings/${details.bookingRef}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>
  `,

  // Trip approved notification
  tripApproved: (tripName, tripId) => `
    <h2>Trip Approved!</h2>
    <p>Great news! Your trip "${tripName}" has been approved and is now live on our platform.</p>
    <p><a href="${process.env.FRONTEND_URL}/trips/${tripId}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Trip</a></p>
    <p>Thank you for creating amazing experiences for our travelers!</p>
  `,

  // Trip rejected notification
  tripRejected: (tripName, reason) => `
    <h2>Trip Review Update</h2>
    <p>Your trip "${tripName}" requires some adjustments before it can be published.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please make the necessary changes and resubmit for review.</p>
    <p><a href="${process.env.FRONTEND_URL}/trips/edit" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Edit Trip</a></p>
  `,

  // Attraction approved notification
  attractionApproved: (attractionName) => `
    <h2>Attraction Approved!</h2>
    <p>Thank you for submitting "${attractionName}"!</p>
    <p>Your attraction has been reviewed and approved. It's now visible to travelers on our platform.</p>
    <p>Thank you for helping us showcase Ghana's amazing destinations!</p>
  `,

  // Attraction rejected notification
  attractionRejected: (attractionName, reason) => `
    <h2>Attraction Review Update</h2>
    <p>Thank you for submitting "${attractionName}".</p>
    <p><strong>Reason for rejection:</strong> ${reason}</p>
    <p>You can submit another attraction or contact our support team for more information.</p>
  `,

  // Review notification for business
  newReview: (businessName, rating, comment) => `
    <h2>New Review on ${businessName}</h2>
    <p>You have received a new review:</p>
    <p><strong>Rating:</strong> ${'⭐'.repeat(rating)}</p>
    <p><strong>Comment:</strong> ${comment}</p>
    <p>Thank you for providing great service to our travelers!</p>
  `,

  // Admin notification - pending approvals
  pendingApprovalsAdmin: (counts) => `
    <h2>Pending Approvals Dashboard</h2>
    <p>You have pending items requiring review:</p>
    <ul>
      <li>Trips: ${counts.trips}</li>
      <li>Attractions: ${counts.attractions}</li>
      <li>Reviews: ${counts.reviews}</li>
    </ul>
    <p><a href="${process.env.ADMIN_URL}/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a></p>
  `,

  // Booking cancellation
  bookingCancelled: (bookingRef, refundAmount) => `
    <h2>Booking Cancelled</h2>
    <p>Your booking (Reference: ${bookingRef}) has been cancelled.</p>
    <p><strong>Refund Amount:</strong> ${refundAmount}</p>
    <p>The refund will be processed to your original payment method within 3-5 business days.</p>
    <p>We hope to see you on a future trip!</p>
  `,
};

module.exports = emailTemplates;
