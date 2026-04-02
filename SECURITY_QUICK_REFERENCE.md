# Security Quick Reference
## Critical Security Points for Ghana Trips Platform

---

## SQL Injection Protection

### How It Works
```javascript
// SAFE - Always use parameterized queries
const query = 'SELECT * FROM users WHERE email = $1 AND status = $2';
const result = await pool.query(query, [email, status]);
// Data never becomes SQL code

// DANGEROUS - Never do this
const badQuery = `SELECT * FROM users WHERE email = '${email}'`;
// Attacker input: ' OR '1'='1 → Executes: ' OR '1'='1
```

### Why It Works
1. SQL code is sent to database separately from data
2. Database knows that $1, $2 are data placeholders, never executable
3. Even if input contains SQL keywords, they're treated as text
4. The `pg` library handles this automatically

### What We Do
✓ All database queries use parameterized queries ($1, $2, etc.)  
✓ Input validation middleware blocks obvious SQL injection attempts  
✓ No string concatenation in queries  
✓ Database user has minimal permissions  

---

## CSRF Token Protection

### Flow
```
1. User loads form → Frontend requests CSRF token
2. Frontend includes token in X-CSRF-Token header
3. Backend validates token format before processing
4. Attacker site cannot generate valid token
5. Request blocked if token missing/invalid
```

### Example
```javascript
// Frontend
const token = await fetch('/api/csrf-token').then(r => r.json());

// Send with any POST/PUT/DELETE request
fetch('/api/trips', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
    'Content-Type': 'application/json'
  }
});

// Backend validates token before processing
```

---

## XSS (Cross-Site Scripting) Prevention

### What It Is
Attacker injects malicious JavaScript into website

### How We Prevent It

**Backend**
```javascript
// Sanitize all input with xss library
const sanitizeInput = (req, res, next) => {
  const xss = require('xss');
  if (req.body?.name) {
    req.body.name = xss(req.body.name);
  }
};
```

**Frontend (React)**
```jsx
// React automatically escapes text
<div>{userInput}</div>  // ✓ Safe - text escaped

// Never use dangerouslySetInnerHTML with user input
<div dangerouslySetInnerHTML={{__html: userInput}} />  // ✗ Dangerous
```

---

## Account Lockout Protection

### How It Works
```
Attempt 1-4: Failed login attempts logged
Attempt 5:   Account locked for 15 minutes
             IP cannot attempt login during lockout
After 15m:   Lockout expires, attempts reset
```

### Implementation
```javascript
// Check failed attempts from IP
const attempts = await pool.query(
  `SELECT COUNT(*) FROM audit_logs 
   WHERE action = 'LOGIN_FAILED' AND ip = $1
   AND created_at > NOW() - INTERVAL '15 minutes'`,
  [ip]
);

if (attempts.rows[0].count >= 5) {
  return res.status(429).json({
    error: 'Too many failed attempts. Try again in 15 minutes.'
  });
}
```

---

## Phishing Detection

### What We Check
```javascript
const suspiciousDomains = ['phish', 'fake', 'test'];
const domain = email.split('@')[1].toLowerCase();

if (suspiciousDomains.some(s => domain.includes(s))) {
  // Block request and log as phishing attempt
  logSecurityEvent('PHISHING_ATTEMPT', { email, ip });
}
```

### Examples Blocked
- user@phishingsite.com
- admin@fakebank.com
- test@testmail.com

### User Education Points
- Verify URL in browser (ghanatrips.com, NOT ghantrips.com)
- Check for HTTPS lock icon
- Never click email links - go directly to site
- Be suspicious of urgency ("Act now!")

---

## Password Security

### Storage
```javascript
// Hash with bcryptjs (10 rounds ≈ 100ms)
const hashedPassword = await bcrypt.hash(password, 10);
// Database stores: $2b$10$... (cannot reverse)
```

### Validation
```javascript
// Must meet requirements:
✓ Minimum 8 characters
✓ At least one uppercase letter
✓ At least one lowercase letter
✓ At least one number
✓ At least one special character

Example: SecurePass123!
```

### Reset Process
```
1. User requests reset → Email sent with secure link
2. Link contains 1-hour token (expires automatically)
3. User sets new password
4. Token marked as used (can't reuse)
5. Old tokens invalidated
6. User notified of password change
```

---

## Rate Limiting

### Configuration
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minute window
  max: 5,                     // 5 requests per window
  message: 'Too many login attempts'
});

// Applied to sensitive endpoints
app.post('/api/auth/login', loginLimiter, handler);
```

### What This Prevents
- Brute force attacks (trying many passwords)
- Dictionary attacks (trying common passwords)
- Credential stuffing (trying stolen credentials)
- DDoS attacks (overwhelming server)

---

## JWT Token Security

### Token Structure
```
Header.Payload.Signature

Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiYWRtaW4ifQ.
TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
```

### Expiry Strategy
```javascript
// Access token: 15 minutes (short, expires often)
jwt.sign(payload, secret, { expiresIn: '15m' });

// Refresh token: 7 days (longer, securely stored)
jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

// When access expires: Use refresh to get new access token
// When refresh expires: Force user to login again
```

### Verification
```javascript
// Every request checks token validity
const token = req.headers['authorization'].split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// If invalid/expired: Request rejected
// If valid: User info extracted and request proceeds
```

---

## Audit Logging

### What Gets Logged
```javascript
// Every admin action
- User password reset
- Account suspension
- Trip approval/rejection
- Settings changes
- System alerts sent
- Maintenance mode toggled

// All login attempts (success and failure)
- Email used
- IP address
- Timestamp
- Success/failure

// Suspicious activity
- SQL injection attempts
- Phishing attempts
- Account lockouts
- Rate limit exceeded
```

### Purpose
```
1. Track who did what and when
2. Investigate security incidents
3. Detect patterns (multiple failures = attack?)
4. Meet compliance requirements
5. Prove system working correctly
```

---

## Environment Variables (Never Commit!)

### Required for Security
```bash
# NEVER put these in code, use .env file
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-256-bit-secret-key-never-share
REFRESH_SECRET=your-refresh-secret-key
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
```

### Git Safety
```bash
# Add to .gitignore (already done)
.env
.env.local
.env*.local

# Use .env.example as template (no secrets)
```

---

## HTTPS/SSL Configuration

### Why It's Critical
```
Without HTTPS:
- Anyone on network can see passwords
- Session tokens visible to eavesdroppers
- Attackers can modify responses

With HTTPS:
- All communication encrypted
- Server verified as authentic
- Man-in-the-middle attacks prevented
```

### Setup
```bash
# Use Let's Encrypt (free)
# Install certbot: https://certbot.eff.org/

# Automatic renewal every 90 days
# Certificate valid 1 year

# In production, enable HSTS:
app.use(helmet.hsts({
  maxAge: 31536000,      // 1 year
  includeSubDomains: true,
  preload: true
}));
```

---

## Database Security

### Principle: Least Privilege
```sql
-- Create limited database user
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_pass';

-- Grant only needed permissions
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT SELECT ON destinations TO app_user;

-- Never grant these:
-- ALTER TABLE, DROP, DELETE (except where needed)
-- CREATE DATABASE, CREATE ROLE
-- SUPERUSER
```

### Backup Security
```bash
# Backup database daily
pg_dump -U postgres -h hostname database > backup.sql

# Encrypt backups
gpg --encrypt backup.sql

# Store off-site (AWS S3, Google Cloud)
# Test restore process monthly
```

---

## Incident Response

### If SQL Injection Detected
1. Check audit logs for unauthorized access
2. Review what data was accessed
3. If payment data exposed: PCI compliance required
4. Notify affected users
5. Force password reset
6. Patch vulnerability

### If Phishing Attack Suspected
1. Identify affected users
2. Send warning email with safe link
3. Force password reset if clicked
4. Monitor for fraud

### If Data Breach Confirmed
1. Isolate affected systems
2. Notify legal team
3. Preserve evidence (logs, backups)
4. Notify users within 72 hours
5. Provide credit monitoring
6. Full security audit

---

## Daily Security Checklist

### Admin Should Check Daily
- [ ] Error logs for suspicious activity
- [ ] Failed login attempts (spike = attack?)
- [ ] Audit logs for unusual actions
- [ ] System alerts functioning
- [ ] Backups completed successfully

### Weekly
- [ ] Review access logs
- [ ] Check for unpatched vulnerabilities
- [ ] Test account lockout mechanism
- [ ] Verify HTTPS working

### Monthly
- [ ] Update all dependencies
- [ ] Run npm audit
- [ ] Review security policies
- [ ] Test password reset flow
- [ ] Verify backups can be restored

### Quarterly
- [ ] Penetration testing
- [ ] Security audit of code
- [ ] User access review
- [ ] Update security procedures

### Annually
- [ ] Full security assessment
- [ ] Compliance audit (GDPR, etc.)
- [ ] Update incident response plan
- [ ] Team security training

---

## Common Vulnerabilities & Fixes

### Vulnerability #1: SQL Injection
**Symptom**: User input directly in SQL queries
**Fix**: Use parameterized queries always
**Example**: Change from `query = "SELECT WHERE id = " + userId` → `query("SELECT WHERE id = $1", [userId])`

### Vulnerability #2: Unencrypted Passwords
**Symptom**: Passwords stored as plain text
**Fix**: Hash with bcryptjs before storing
**Example**: `password = bcrypt.hash(password, 10)`

### Vulnerability #3: No HTTPS
**Symptom**: Website accessed via http://
**Fix**: Install SSL certificate, enforce HTTPS
**Example**: Use Let's Encrypt (free)

### Vulnerability #4: Weak Password Requirements
**Symptom**: User can set "password" or "123456"
**Fix**: Enforce minimum 8 chars + complexity
**Example**: Require uppercase, lowercase, number, symbol

### Vulnerability #5: No Rate Limiting
**Symptom**: Anyone can try unlimited login attempts
**Fix**: Implement rate limiting
**Example**: Max 5 login attempts per 15 minutes

### Vulnerability #6: No Audit Logging
**Symptom**: Can't track who accessed what
**Fix**: Log all important actions
**Example**: Every admin action → audit_logs table

---

## Testing Security Manually

### Test SQL Injection
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin\\" OR 1=1--","password":"anything"}'

# Should get: "Invalid input detected"
# If you get logged in: VULNERABILITY!
```

### Test Account Lockout
```bash
# Try login 6 times with wrong password
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -d '{"email":"test@example.com","password":"wrongpass"}'
done

# 6th attempt should fail with rate limit message
```

### Test CSRF Protection
```bash
curl -X POST http://localhost:5000/api/trips \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Trip"}' \
  # Missing X-CSRF-Token header

# Should fail with: "CSRF token missing"
```

---

## Key Takeaways

1. **SQL Injection**: Always use parameterized queries
2. **Passwords**: Hash with bcryptjs, enforce strong requirements
3. **HTTPS**: Use SSL certificate (Let's Encrypt)
4. **Rate Limiting**: Limit login attempts
5. **Audit Logs**: Log all important actions
6. **CSRF Tokens**: Validate on state-changing requests
7. **XSS Prevention**: Sanitize input, escape output
8. **Account Lockout**: Lockout after multiple failures
9. **Backups**: Daily backups, test restoration
10. **Monitoring**: Watch logs for suspicious activity

---

## Emergency Contact

**If security issue found:**
1. Don't post in public issues
2. Email: security@ghanatrips.com
3. Response time: 24-48 hours
4. Will not disclose publicly until fixed

---

This platform is built with **enterprise-grade security**. Every layer is protected. Use it with confidence!
