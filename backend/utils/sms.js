const axios = require('axios');

const ARKESEL_API_KEY = process.env.ARKESEL_API_KEY;
const ARKESEL_SENDER_ID = process.env.ARKESEL_SENDER_ID || 'GhanaTravel';
const ARKESEL_BASE_URL = 'https://sms.arkesel.com/api/sms/send';

/**
 * Send SMS via Arkesel
 */
exports.sendSMS = async ({ to, message }) => {
  try {
    if (!to || !message) {
      console.error('[sms] Missing recipient phone or message');
      return null;
    }

    if (!ARKESEL_API_KEY) {
      console.warn('[sms] ARKESEL_API_KEY not configured, skipping SMS');
      return null;
    }

    // Format phone number (ensure it starts with country code)
    const phone = to.startsWith('+') ? to : `+233${to.slice(-9)}`;

    const result = await axios.post(ARKESEL_BASE_URL, {
      api_key: ARKESEL_API_KEY,
      senders_id: ARKESEL_SENDER_ID,
      message,
      recipients: phone,
    });

    console.log(`[sms] Sent to ${phone}:`, result.data);
    return result.data;
  } catch (error) {
    console.error('[sms] Error sending SMS:', error.message);
    // Don't throw - SMS failure shouldn't break the application
    return null;
  }
};

/**
 * Send batch SMS
 */
exports.sendBatchSMS = async (recipients) => {
  try {
    const results = await Promise.all(
      recipients.map((r) =>
        exports.sendSMS({
          to: r.phone,
          message: r.message,
        }).catch(console.error)
      )
    );
    return results;
  } catch (error) {
    console.error('[sms] Error sending batch SMS:', error);
    return null;
  }
};
