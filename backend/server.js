const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = require('./db');
const prisma = require('./lib/prisma');

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per windowMs
  message: 'Too many registration attempts, please try again later',
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests, please try again later',
});

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(generalLimiter);

// Audit logging middleware
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (obj) {
    // Log sensitive operations
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.user?.userId) {
      prisma.auditLog.create({
        data: {
          actorId: req.user.userId,
          action: req.method,
          resourceType: req.path.split('/')[2] || 'unknown',
          resourceId: req.body?.id,
          ip: req.ip,
        },
      }).catch(console.error);
    }
    if (obj && obj.success !== undefined) {
      return originalJson.call(this, toCamel(obj));
    }
    return originalJson.call(this, obj);
  };
  next();
});

// camelCase utility
const toCamel = (o) => {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(toCamel);
  const n = {};
  Object.keys(o).forEach((k) => {
    const camel = k.replace(/([-_][a-z])/g, (g) => g.toUpperCase().replace('-', '').replace('_', ''));
    n[camel] = toCamel(o[k]);
  });
  return n;
};

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (obj) {
    if (obj && obj.success !== undefined) {
      return originalJson.call(this, toCamel(obj));
    }
    return originalJson.call(this, obj);
  };
  next();
});

const authRouter = require('./routes/auth');
authRouter.post('/login', loginLimiter);
authRouter.post('/register', registerLimiter);
authRouter.post('/forgot-password', loginLimiter);
app.use('/api/auth', authRouter);
app.use('/api/hotels', require('./routes/hotels'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/attractions', require('./routes/attractions'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/chat', require('./routes/chat'));

// User content routes (destinations, hotels, attractions, etc.)
app.use('/api/content', require('./routes/userContent'));

// Consolidated admin routes
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { pool };
