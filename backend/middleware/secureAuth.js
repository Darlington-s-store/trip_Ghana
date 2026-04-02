const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'ghanatravel-secret-key-2026';

/**
 * SECURITY: Verify JWT token and attach user to request
 */
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * SECURITY: Verify user has admin role
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

/**
 * SECURITY: Verify user has super admin role
 */
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  next();
};

/**
 * SECURITY: Verify resource ownership
 */
exports.verifyOwnership = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      const resourceOwnerId = req.body?.[resourceField] || req.params?.userId;

      // Admin bypass
      if (req.user?.role === 'admin') {
        return next();
      }

      if (userId !== resourceOwnerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
      }

      next();
    } catch (err) {
      res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
};

/**
 * SECURITY: Check email verification status
 */
exports.requireEmailVerified = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      'SELECT email_verified FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!result.rows[0].email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required to perform this action',
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Email verification check failed' });
  }
};

/**
 * SECURITY: Rate limit by user ID for sensitive operations
 */
exports.enforceIdempotency = (key) => {
  const requestMap = new Map();

  return (req, res, next) => {
    const userId = req.user?.userId;
    const requestKey = `${userId}-${key}-${req.method}-${req.path}`;
    const now = Date.now();

    if (requestMap.has(requestKey)) {
      const lastRequest = requestMap.get(requestKey);
      if (now - lastRequest < 5000) { // 5 second window
        return res.status(429).json({ success: false, message: 'Too many requests, please try again later' });
      }
    }

    requestMap.set(requestKey, now);

    // Clean up old entries
    if (requestMap.size > 10000) {
      const expired = now - 60000; // Remove entries older than 1 minute
      for (const [k, v] of requestMap.entries()) {
        if (v < expired) requestMap.delete(k);
      }
    }

    next();
  };
};

module.exports = exports;
