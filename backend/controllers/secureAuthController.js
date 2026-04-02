const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'ghanatravel-secret-key-2026';
const JWT_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

/**
 * SECURITY: Hash password with bcryptjs (10 salt rounds)
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * SECURITY: Compare passwords
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * SECURITY: Generate 6-digit email verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * SECURITY: Hash verification code
 */
function hashVerificationCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Register new user with email verification
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // SECURITY: Input validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // SECURITY: Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeHash = hashVerificationCode(verificationCode);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, email_verified)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING id, email, first_name, last_name`,
      [email, hashedPassword, firstName, lastName, phone || null]
    );

    const user = result.rows[0];

    // SECURITY: Store verification code hash (not the code itself)
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, verificationCodeHash, new Date(Date.now() + 10 * 60 * 1000)] // 10 min expiry
    );

    // TODO: Send verification email with verificationCode

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        userId: user.id,
        email: user.email,
        requiresVerification: true,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

/**
 * Login user with email and password
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // SECURITY: Case-insensitive email lookup
    const result = await pool.query(
      `SELECT id, password, role, status, email_verified FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      // SECURITY: Don't reveal if email exists
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // SECURITY: Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended' });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // SECURITY: Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, email: email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: REFRESH_EXPIRY }
    );

    // SECURITY: Return tokens in response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          userId: user.id,
          role: user.role,
          emailVerified: user.email_verified,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    // Verify user still exists
    const result = await pool.query('SELECT id, role FROM users WHERE id = $1 AND status = $2', [
      decoded.userId,
      'active',
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    const user = result.rows[0];

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

/**
 * Get user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, avatar, role, status, email_verified, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { firstName, lastName, phone, avatar } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, phone = $3, avatar = $4
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, avatar`,
      [firstName, lastName, phone, avatar, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    // Get current password hash
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, result.rows[0].password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // SECURITY: Hash new password
    const hashedPassword = await hashPassword(newPassword);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

/**
 * Forgot password - request code
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    // Check if user exists
    const result = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);

    if (result.rows.length === 0) {
      // SECURITY: Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If email exists, password reset link will be sent',
      });
    }

    const userId = result.rows[0].id;

    // Generate reset code
    const resetCode = generateVerificationCode();
    const resetCodeHash = hashVerificationCode(resetCode);

    // Store reset code
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, resetCodeHash, new Date(Date.now() + 1 * 60 * 60 * 1000)] // 1 hour expiry
    );

    // TODO: Send reset code email

    res.json({
      success: true,
      message: 'Password reset code sent to email',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to process password reset' });
  }
};

/**
 * Reset password with code
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code, and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Find user
    const userResult = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Verify reset code
    const codeHash = hashVerificationCode(code);
    const tokenResult = await pool.query(
      `SELECT id FROM password_reset_tokens 
       WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW() AND used_at IS NULL`,
      [userId, codeHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or expired reset code' });
    }

    const tokenId = tokenResult.rows[0].id;

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and mark token as used
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [tokenId]);

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};
