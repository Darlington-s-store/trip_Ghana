const { Resend } = require('resend');
const axios = require('axios');
const { pool } = require('../server');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API);

const sendEmail = async (to, subject, body) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'GhanaTrips <notifications@ghanatrips.com>', // Note: This needs a verified domain on Resend
      to: [to],
      subject: subject,
      html: body,
    });

    if (error) {
      console.error('[RESEND ERROR]', error);
      return false;
    }
    
    console.log(`[EMAIL SENT] ID: ${data.id}`);
    return true;
  } catch (err) {
    console.error('[EMAIL EXCEPTION]', err);
    return false;
  }
};

const sendSMS = async (to, message) => {
  try {
    if (!process.env.ARKESEL_API_KEY) {
      console.warn('[SMS SKIPPED] Missing ARKESEL_API_KEY');
      return false;
    }

    const response = await axios.post('https://sms.arkesel.com/sms/api?action=send-sms', {
      api_key: process.env.ARKESEL_API_KEY,
      to,
      from: process.env.ARKESEL_SENDER_ID || 'GHTrips',
      sms: message
    });

    if (response.data.code === '1000') {
      console.log(`[SMS SENT] To: ${to}`);
      return true;
    } else {
      console.error('[ARKESEL ERROR]', response.data);
      return false;
    }
  } catch (err) {
    console.error('[SMS EXCEPTION]', err);
    return false;
  }
};

const notify = async ({ userId, title, message, type = 'system', channel = 'in-app' }) => {
  try {
    // 1. Store in-app notification
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, channel) VALUES ($1, $2, $3, $4, $5)',
      [userId, title, message, type, channel]
    );

    // 2. Fetch user contact info if needed
    if (channel !== 'in-app') {
      const userResult = await pool.query('SELECT email, phone FROM users WHERE id = $1', [userId]);
      const user = userResult.rows[0];

      if (user) {
        if ((channel === 'email' || channel === 'both') && user.email) {
          await sendEmail(user.email, title, message);
        }
        if ((channel === 'sms' || channel === 'both') && user.phone) {
          await sendSMS(user.phone, `${title}: ${message}`);
        }
      }
    }

    return { success: true };
  } catch (err) {
    console.error('[NOTIFY ERROR]', err);
    return { success: false, error: err.message };
  }
};

module.exports = { notify, sendEmail, sendSMS };
