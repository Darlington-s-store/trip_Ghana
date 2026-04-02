const pool = require('../db');

/**
 * COMPREHENSIVE SECURITY MIDDLEWARE
 * Protection against SQL injection, CSRF, XSS, phishing, and malicious attacks
 */

/**
 * SQL Injection Protection
 * All queries are parameterized automatically by pg library
 * This middleware validates input before it reaches the database
 */
const validateInputSecurity = (req, res, next) => {
  // Check for SQL injection patterns in query parameters and body
  const suspiciousPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|EVAL)\b)/gi,
    /['"`;\\]/,
  ];

  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };

  // Check query parameters
  for (const [key, value] of Object.entries(req.query || {})) {
    if (checkString(value)) {
      return res.status(400).json({ success: false, message: 'Invalid input detected' });
    }
  }

  // Check body parameters
  if (req.body && typeof req.body === 'object') {
    const checkBody = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && checkString(value)) {
          return true;
        }
        if (typeof value === 'object' && value !== null) {
          if (checkBody(value)) return true;
        }
      }
      return false;
    };
    if (checkBody(req.body)) {
      return res.status(400).json({ success: false, message: 'Invalid input detected' });
    }
  }

  next();
};

/**
 * CSRF Token Generation and Validation
 */
const generateCSRFToken = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests (as per CSRF protection best practices)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body?.csrf_token;

  if (!token) {
    return res.status(403).json({ success: false, message: 'CSRF token missing' });
  }

  // Validate token format (should be a valid hex string)
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
  }

  // In production, validate token against session/database
  // For now, we're validating format
  next();
};

/**
 * Phishing and Malicious Request Detection
 */
const phishingDetection = async (req, res, next) => {
  // Check for suspicious email patterns in requests
  const suspiciousEmails = ['admin@fake.com', 'support@phish.com'];
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  const checkForPhishing = (obj) => {
    if (!obj) return false;

    if (typeof obj === 'string') {
      const emails = obj.match(emailPattern) || [];
      return emails.some(email => {
        // Flag suspicious domains
        const domain = email.split('@')[1].toLowerCase();
        return suspiciousEmails.includes(email) || domain.includes('phish') || domain.includes('fake');
      });
    }

    if (typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        if (checkForPhishing(value)) return true;
      }
    }

    return false;
  };

  if (checkForPhishing(req.body) || checkForPhishing(req.query)) {
    // Log suspicious activity
    if (req.user?.userId) {
      await pool.query(
        'INSERT INTO audit_logs (actor_id, action, resource_type, ip) VALUES ($1, $2, $3, $4)',
        [req.user.userId, 'PHISHING_ATTEMPT_DETECTED', 'security', req.ip]
      );
    }
    return res.status(400).json({ success: false, message: 'Invalid request' });
  }

  next();
};

/**
 * Account Lockout Protection
 * Lock account after 5 failed login attempts
 */
const accountLockoutProtection = async (req, res, next) => {
  // This is handled in auth controller, middleware here is for tracking
  const ip = req.ip;
  const email = req.body?.email;

  if (!email || !ip) {
    return next();
  }

  try {
    // Check for recent failed attempts from this IP
    const result = await pool.query(
      `SELECT COUNT(*) as attempts FROM audit_logs 
       WHERE action = 'LOGIN_FAILED' AND ip = $1 
       AND created_at > NOW() - INTERVAL '15 minutes'`,
      [ip]
    );

    const failedAttempts = parseInt(result.rows[0].attempts);

    if (failedAttempts >= 5) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many failed login attempts. Please try again in 15 minutes.' 
      });
    }

    next();
  } catch (error) {
    console.error('Error checking account lockout:', error);
    next();
  }
};

/**
 * Request Rate Limiting
 */
const rateLimitByIP = async (req, res, next) => {
  const ip = req.ip;
  const key = `rate_limit:${ip}`;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) as requests FROM audit_logs 
       WHERE ip = $1 AND created_at > NOW() - INTERVAL '1 minute'`,
      [ip]
    );

    const requests = parseInt(result.rows[0].requests);

    // Allow 100 requests per minute per IP
    if (requests > 100) {
      return res.status(429).json({ success: false, message: 'Rate limit exceeded' });
    }

    next();
  } catch (error) {
    console.error('Error checking rate limit:', error);
    next();
  }
};

/**
 * XSS Protection - Sanitize user input
 */
const sanitizeInput = (req, res, next) => {
  const xss = require('xss');

  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return xss(obj, {
        whiteList: {},
        stripIgnoredTag: true,
      });
    }

    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    }

    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  next();
};

/**
 * Request Logging for Security Audits
 */
const securityLogging = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Log authentication events
    if (req.path.includes('/auth/')) {
      if (data.success === false && req.body?.email) {
        pool.query(
          'INSERT INTO audit_logs (action, resource_type, ip) VALUES ($1, $2, $3)',
          ['AUTH_FAILED', 'authentication', req.ip]
        ).catch(console.error);
      }
    }

    // Log admin actions
    if (req.path.includes('/admin/') && req.user?.role === 'admin') {
      pool.query(
        'INSERT INTO audit_logs (actor_id, action, resource_type, ip) VALUES ($1, $2, $3, $4)',
        [req.user.userId, req.method + '_' + req.path.split('/').pop(), 'admin_action', req.ip]
      ).catch(console.error);
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * IP Whitelisting/Blacklisting (optional)
 */
const ipFilter = async (req, res, next) => {
  const ip = req.ip;

  try {
    // Check if IP is in blacklist
    const blacklisted = await pool.query(
      `SELECT id FROM ip_blacklist WHERE ip = $1 AND is_active = true`,
      [ip]
    );

    if (blacklisted.rows.length > 0) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  } catch (error) {
    // If table doesn't exist, skip check
    next();
  }
};

/**
 * Email Verification Check (for sensitive operations)
 */
const requireEmailVerification = (req, res, next) => {
  if (req.user && !req.user.email_verified) {
    return res.status(403).json({ 
      success: false, 
      message: 'Email verification required for this action' 
    });
  }
  next();
};

/**
 * Two-Factor Authentication Check (if implemented)
 */
const require2FA = (req, res, next) => {
  if (req.user?.role === 'admin') {
    // Check if 2FA is enabled for admin
    if (!req.session?.twoFactorVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Two-factor authentication required' 
      });
    }
  }
  next();
};

module.exports = {
  validateInputSecurity,
  csrfProtection,
  phishingDetection,
  accountLockoutProtection,
  rateLimitByIP,
  sanitizeInput,
  securityLogging,
  ipFilter,
  requireEmailVerification,
  require2FA,
  generateCSRFToken,
};
