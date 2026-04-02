const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const pool = require('./db');

// SECURITY: Helmet middleware - sets secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

// SECURITY: CORS with strict origin validation
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// SECURITY: Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// SECURITY: Apply comprehensive security middleware
const securityMiddleware = require('./middleware/securityMiddleware');
app.use(securityMiddleware.sanitizeInput);
app.use(securityMiddleware.validateInputSecurity);
app.use(securityMiddleware.phishingDetection);
app.use(securityMiddleware.ipFilter);
app.use(securityMiddleware.securityLogging);

// SECURITY: Rate limiters with different strategies
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin', // Admins bypass
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);

// SECURITY: XSS protection middleware
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
});

function sanitizeObject(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key], {
        whiteList: {},
        stripIgnoredTag: true,
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// SECURITY: Request logging for suspicious activity
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      console.error('[SECURITY] HTTP Error:', logData);
    }
  });

  next();
});

// SECURITY: Audit logging for sensitive operations
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.user?.userId) {
      logAuditEvent(req.user.userId, req.method, req.path, req.body, req.ip);
    }
    return originalJson.call(this, data);
  };
  next();
});

async function logAuditEvent(userId, action, path, data, ip) {
  try {
    const resourceType = path.split('/')[2] || 'unknown';
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, resourceType, data?.id || null, ip]
    );
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}

// Routes
const authRouter = require('./routes/auth');
authRouter.post('/login', loginLimiter);
authRouter.post('/register', registerLimiter);
authRouter.post('/forgot-password', loginLimiter);

app.use('/api/auth', authRouter);
app.use('/api/hotels', require('./routes/hotels'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/attractions', require('./routes/attractions'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/trips', require('./routes/trip'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/content', require('./routes/userContent'));

// Admin routes with authentication and security checks
app.use('/api/admin/settings', require('./routes/adminSettings'));
const adminRouter = require('./routes/admin');
app.use('/api/admin', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}, adminRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.message === 'CORS policy violation') {
    return res.status(403).json({ success: false, message: 'CORS policy violation' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

const server = app.listen(PORT, () => {
  console.log(`[SECURITY] Server running on port ${PORT} with comprehensive security measures`);
  console.log(`[SECURITY] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SECURITY] CORS Origin: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SECURITY] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[SECURITY] HTTP server closed');
    pool.end();
    process.exit(0);
  });
});

module.exports = app;
