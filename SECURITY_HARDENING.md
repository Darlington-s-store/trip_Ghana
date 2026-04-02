# Comprehensive Security Hardening Guide
## Ghana Trips Platform - Enterprise-Grade Security

---

## Table of Contents
1. SQL Injection Prevention
2. CSRF Protection
3. Phishing Detection & Prevention
4. Account Security
5. Data Protection
6. API Security
7. Frontend Security
8. Deployment Security

---

## 1. SQL Injection Prevention

### Backend Implementation (Node.js + PostgreSQL)

**Parameterized Queries (Primary Defense)**
```javascript
// ✓ SAFE - Using parameterized queries
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1 AND status = $2',
  [userEmail, 'active']
);

// ✗ DANGEROUS - String concatenation (NEVER DO THIS)
const badQuery = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

**Why This Works:**
- The `pg` library separates SQL code from data
- Malicious SQL in parameters is treated as data, not executable code
- Example attack attempt fails:
  ```
  Input: ' OR '1'='1
  Result: Looks for user with email matching literally "' OR '1'='1" (no match)
  ```

### Security Middleware Implementation
```javascript
// In middleware/securityMiddleware.js
const validateInputSecurity = (req, res, next) => {
  const suspiciousPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE)\b)/gi,
  ];
  
  // Validates all inputs before reaching controllers
  // Blocks obvious SQL injection attempts
};
```

### Defense Layers
1. **Input Validation** - Block suspicious patterns
2. **Parameterized Queries** - Separate SQL from data
3. **Least Privilege** - Database user has minimal permissions
4. **Audit Logging** - Track all data access

---

## 2. CSRF (Cross-Site Request Forgery) Protection

### Implementation
```javascript
// Frontend - Get CSRF token
const response = await fetch('/api/csrf-token');
const { token } = await response.json();

// Frontend - Send CSRF token with requests
const result = await fetch('/api/trips', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});

// Backend - Validate CSRF token
const csrfProtection = (req, res, next) => {
  const token = req.headers['x-csrf-token'];
  if (!token) return res.status(403).json({ error: 'CSRF token missing' });
  // Validate token...
};
```

### How It Protects
- Malicious sites cannot generate valid CSRF tokens
- Even if attacker tricks user into clicking link, request fails validation
- Token tied to user session

---

## 3. Phishing Detection & Prevention

### Frontend Email Validation
```typescript
const validateEmail = (email: string): boolean => {
  // Reject suspicious email patterns
  const suspiciousDomains = ['phish', 'fake', 'test'];
  const domain = email.split('@')[1].toLowerCase();
  
  if (suspiciousDomains.some(s => domain.includes(s))) {
    return false;
  }
  
  // Use standard email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### Backend Phishing Detection
```javascript
// middleware/securityMiddleware.js
const phishingDetection = async (req, res, next) => {
  // Flag suspicious emails in requests
  // Log attempted phishing attacks
  // Block user after repeated attempts
};
```

### User Education
- Verify URL in browser (should be yourdomain.com)
- Never click email links - go directly to site
- Enable two-factor authentication
- Watch for urgency tactics in emails

---

## 4. Account Security

### Password Requirements
```javascript
// Strong password validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  return password.length >= minLength &&
         hasUppercase && hasLowercase && 
         hasNumber && hasSpecial;
};
```

### Password Reset Flow
```
1. User requests password reset
2. System generates secure token (UUID)
3. Email sent with reset link (contains token)
4. User clicks link, enters new password
5. Token validated before password update
6. Token expires after 1 hour
7. Old tokens invalidated after successful reset
```

### Admin Password Reset
```javascript
// Admin can reset user password
POST /api/admin/settings/users/:userId/reset-password
{
  "newPassword": "SecureNewPassword123!"
}

// Triggers notification to user
// Logs action in audit logs
```

### Account Lockout Protection
```javascript
// Automatic lockout after 5 failed login attempts
// Lockout duration: 15 minutes
// After unlock: counter resets

Failed Attempt Tracking:
- Failed login attempts logged per IP
- Stored in database with timestamp
- Checked on each login attempt
```

### Two-Factor Authentication (Optional Enhancement)
```javascript
// Step 1: User logs in with email/password
// Step 2: System sends 6-digit code via email
// Step 3: User enters code to complete login
// Step 4: 2FA verified before JWT issued
```

---

## 5. Data Protection

### Encryption in Transit
```javascript
// HTTPS Only
app.use(helmet.hsts({
  maxAge: 31536000,      // 1 year
  includeSubDomains: true,
  preload: true
}));

// All traffic must be HTTPS in production
// Certificate: Let's Encrypt or commercial CA
```

### Encryption at Rest (Sensitive Data)
```javascript
const crypto = require('crypto');

const encryptData = (data, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Encrypt: payment tokens, API keys, sensitive user info
// Decrypt only when needed for processing
```

### Password Hashing
```javascript
const bcrypt = require('bcryptjs');

// Hash password during registration
const hashedPassword = await bcrypt.hash(password, 10);

// Verify during login
const isMatch = await bcrypt.compare(password, hashedPassword);

// 10 rounds = ~100ms hash time (strong security)
```

### Database Access Control
```sql
-- Create limited database user (not using admin)
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT SELECT ON destinations TO app_user;
-- NOT granting DELETE or ALTER

-- Never grant SUPERUSER or CREATEDB
```

---

## 6. API Security

### Rate Limiting
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 5,                        // 5 requests
  message: 'Too many login attempts'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 100,                      // 100 requests
});

app.post('/api/auth/login', loginLimiter, loginHandler);
app.use('/api/', apiLimiter);
```

### JWT Security
```javascript
const token = jwt.sign(
  { userId, role },
  process.env.JWT_SECRET,
  {
    expiresIn: '15m',           // Short expiry (15 minutes)
    algorithm: 'HS256'
  }
);

// Refresh token (7 days, rotated frequently)
const refreshToken = jwt.sign(
  { userId },
  process.env.REFRESH_SECRET,
  { expiresIn: '7d' }
);

// Verify in middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

### CORS Configuration
```javascript
const allowedOrigins = [
  'https://ghanatrips.com',
  'https://www.ghanatrips.com',
  'https://admin.ghanatrips.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  maxAge: 86400
}));
```

### Input Sanitization
```javascript
const sanitizeInput = (req, res, next) => {
  const xss = require('xss');
  
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  
  next();
};
```

---

## 7. Frontend Security

### XSS Prevention
```typescript
// React automatically escapes text content
// ✓ SAFE - React escapes text
<div>{userInput}</div>

// ✗ DANGEROUS - Allows HTML
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ✓ SAFE - Use DOMPurify for HTML content
import DOMPurify from 'dompurify';
<div>{DOMPurify.sanitize(htmlContent)}</div>
```

### Content Security Policy (CSP)
```javascript
// In server.js via Helmet
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.ghanatrips.com'],
    fontSrc: ["'self'", 'https://fonts.googleapis.com'],
  }
}));
```

### Secure Token Storage
```typescript
// ✓ SECURE - httpOnly cookie (not accessible via JS)
// Automatically sent with requests
// Protected from XSS attacks

// ✗ INSECURE - localStorage (accessible to XSS)
localStorage.setItem('token', token); // Don't do this
```

### Form Security
```typescript
interface FormData {
  email: string;
  password: string;
  csrf_token: string;
}

// Validate on client
const validateForm = (data: FormData) => {
  if (!data.email.includes('@')) return false;
  if (data.password.length < 8) return false;
  if (!data.csrf_token) return false;
  return true;
};

// Send with CSRF token
const submit = async (form: FormData) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': form.csrf_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(form)
  });
};
```

---

## 8. Deployment Security

### Environment Variables
```bash
# .env (never commit to git)
DATABASE_URL=postgresql://user:pass@neon.postgres.vercel.com:5432/ghanatrips
JWT_SECRET=your-super-secret-256-bit-key-here
REFRESH_SECRET=your-refresh-secret-key-here
CORS_ORIGIN=https://ghanatrips.com
NODE_ENV=production
```

### Security Checklist
- [ ] HTTPS enabled in production
- [ ] Environment variables not in code
- [ ] Database backups automated daily
- [ ] Logs monitored for suspicious activity
- [ ] WAF (Web Application Firewall) enabled
- [ ] DDoS protection enabled
- [ ] Regular security audits scheduled
- [ ] Team trained on security practices

### Monitoring & Alerting
```javascript
// Log security events
const logSecurityEvent = async (type, details) => {
  await pool.query(
    'INSERT INTO security_events (type, details, created_at) VALUES ($1, $2, NOW())',
    [type, JSON.stringify(details)]
  );
  
  // Alert admin if critical
  if (['phishing_attempt', 'sql_injection'].includes(type)) {
    await sendAdminAlert(type, details);
  }
};
```

---

## Incident Response Plan

### If SQL Injection is Detected
1. Disable affected account immediately
2. Review audit logs for unauthorized access
3. Check if payment data was exposed
4. Notify affected users via email
5. Force password reset for compromised accounts
6. Review and patch vulnerable code

### If Phishing Attack is Detected
1. Identify affected users
2. Send warning email with safe login link
3. Monitor accounts for unauthorized access
4. Reset passwords for compromised accounts
5. Increase monitoring for that IP

### If Data Breach is Suspected
1. Isolate affected systems
2. Preserve logs and evidence
3. Contact legal team
4. Notify users within 72 hours
5. Provide free credit monitoring
6. Review and improve security

---

## Regular Security Maintenance

### Weekly
- [ ] Review access logs
- [ ] Check for failed login attempts
- [ ] Monitor API error rates

### Monthly
- [ ] Security audit of new code
- [ ] Update dependencies (npm audit)
- [ ] Review admin actions
- [ ] Test backup restoration

### Quarterly
- [ ] Penetration testing
- [ ] Security training for team
- [ ] Update security policies
- [ ] Review third-party integrations

### Annually
- [ ] Full security audit
- [ ] Update security certifications
- [ ] Review incident response plan
- [ ] Compliance check (GDPR, etc.)

---

## Resources & References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- PostgreSQL Security: https://www.postgresql.org/docs/current/sql-syntax.html
- Express Security: https://expressjs.com/en/advanced/best-practice-security.html
- Node Security: https://nodejs.org/en/docs/guides/nodejs-security/

---

## Contact & Support

For security concerns or vulnerabilities, please contact:
- Security Team: security@ghanatrips.com
- Report privately: Do not post in public issues
- Response time: 24-48 hours
