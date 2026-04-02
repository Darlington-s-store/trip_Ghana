const Bull = require('bull');
const redis = require('redis');

// Create notification queue
const notificationQueue = new Bull('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
});

// Email job processor
notificationQueue.process('email', 5, async (job) => {
  const { to, subject, template, data } = job.data;
  
  try {
    const sendEmail = require('../utils/email').sendEmail;
    await sendEmail(to, subject, template, data);
    return { success: true, messageId: `${Date.now()}-${Math.random()}` };
  } catch (error) {
    // Retry up to 3 times with exponential backoff
    throw error;
  }
});

// SMS job processor
notificationQueue.process('sms', 5, async (job) => {
  const { phoneNumber, message } = job.data;
  
  try {
    const sendSMS = require('../utils/sms').sendSMS;
    await sendSMS(phoneNumber, message);
    return { success: true, messageId: `${Date.now()}-${Math.random()}` };
  } catch (error) {
    throw error;
  }
});

// In-app notification processor
notificationQueue.process('in-app', 10, async (job) => {
  const prisma = require('../lib/prisma');
  const { userId, title, message, type, relatedId } = job.data;
  
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedId,
      },
    });
    return { success: true };
  } catch (error) {
    throw error;
  }
});

// Event listeners
notificationQueue.on('completed', (job) => {
  console.log(`[Queue] Job ${job.id} completed:`, job.data);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`[Queue] Job ${job.id} failed:`, err.message);
});

notificationQueue.on('error', (error) => {
  console.error('[Queue] Error:', error);
});

// Queue helper functions
const enqueueNotification = async (type, data, options = {}) => {
  const defaultOptions = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  };

  return notificationQueue.add(type, data, {
    ...defaultOptions,
    ...options,
  });
};

const enqueueEmail = async (to, subject, template, data) => {
  return enqueueNotification('email', { to, subject, template, data }, {
    priority: 5,
  });
};

const enqueueSMS = async (phoneNumber, message) => {
  return enqueueNotification('sms', { phoneNumber, message }, {
    priority: 4,
  });
};

const enqueueInAppNotification = async (userId, title, message, type, relatedId = null) => {
  return enqueueNotification('in-app', { userId, title, message, type, relatedId }, {
    priority: 10,
  });
};

module.exports = {
  notificationQueue,
  enqueueNotification,
  enqueueEmail,
  enqueueSMS,
  enqueueInAppNotification,
};
