const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@ghanatravel.com';

/**
 * Email templates
 */
const templates = {
  'password-reset': (data) => ({
    subject: 'Reset Your Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${data.firstName},</p>
      <p>You requested to reset your password. Please use the following code to reset it:</p>
      <h1 style="font-size: 32px; font-weight: bold; letter-spacing: 2px;">${data.code}</h1>
      <p>This code expires in ${data.expiresIn}.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>GhanaTravel Team</p>
    `,
  }),
  'booking-confirmation': (data) => ({
    subject: `Booking Confirmed - ${data.bookingType}`,
    html: `
      <h2>Booking Confirmed</h2>
      <p>Hi ${data.firstName},</p>
      <p>Your ${data.bookingType} booking has been confirmed!</p>
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p><strong>Booking Details:</strong></p>
        <p>Reference: ${data.reference}</p>
        <p>Amount: ${data.currency} ${data.amount}</p>
        <p>Date: ${data.date}</p>
      </div>
      <p>Thank you for choosing GhanaTravel!</p>
    `,
  }),
  'trip-approval': (data) => ({
    subject: `Trip Approved - ${data.tripName}`,
    html: `
      <h2>Trip Approved</h2>
      <p>Hi ${data.firstName},</p>
      <p>Great news! Your trip "${data.tripName}" has been approved by our team.</p>
      <p>You can now proceed with your bookings and preparations.</p>
      <p>Happy travels!<br>GhanaTravel Team</p>
    `,
  }),
  'trip-rejection': (data) => ({
    subject: `Trip Needs Revision - ${data.tripName}`,
    html: `
      <h2>Trip Revision Requested</h2>
      <p>Hi ${data.firstName},</p>
      <p>Your trip "${data.tripName}" requires revision.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p>Please log in to your account and update your trip accordingly.</p>
      <p>Best regards,<br>GhanaTravel Team</p>
    `,
  }),
  'account-suspended': (data) => ({
    subject: 'Account Suspended',
    html: `
      <h2>Account Suspended</h2>
      <p>Hi ${data.firstName},</p>
      <p>Your account has been suspended.</p>
      <p><strong>Reason:</strong> ${data.reason || 'Violation of community guidelines'}</p>
      <p>If you believe this is a mistake, please contact our support team.</p>
      <p>Best regards,<br>GhanaTravel Team</p>
    `,
  }),
};

/**
 * Send email
 */
exports.sendEmail = async ({ to, subject, template, data, html }) => {
  try {
    if (!to) {
      console.error('[email] Missing recipient email');
      return null;
    }

    let emailData;
    if (template && templates[template]) {
      emailData = templates[template](data);
    } else if (html) {
      emailData = { subject, html };
    } else {
      throw new Error('Either template or html must be provided');
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: emailData.subject,
      html: emailData.html,
    });

    console.log(`[email] Sent to ${to}:`, result);
    return result;
  } catch (error) {
    console.error('[email] Error sending email:', error);
    throw error;
  }
};

/**
 * Send batch emails
 */
exports.sendBatchEmails = async (recipients) => {
  try {
    const results = await Promise.all(
      recipients.map((r) =>
        exports.sendEmail({
          to: r.to,
          subject: r.subject,
          template: r.template,
          data: r.data,
        }).catch(console.error)
      )
    );
    return results;
  } catch (error) {
    console.error('[email] Error sending batch emails:', error);
    throw error;
  }
};
