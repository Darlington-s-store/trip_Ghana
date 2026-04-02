# System Architecture
## Ghana Trips Platform - Visual & Technical Overview

---

## System Components Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                       │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────┐         ┌──────────────────┐
│  │  Web Frontend    │         │ Mobile Web/App   │
│  │  (React/Vue)     │         │ (React Native)   │
│  └────────┬─────────┘         └────────┬─────────┘
│           │                            │
│           └────────────┬───────────────┘
│                        │
│              ┌─────────▼─────────┐
│              │ HTTPS Connection  │
│              │ (SSL/TLS)         │
│              └─────────┬─────────┘
│                        │
├─────────────────────────────────────────────────────────────────┤
│                     SECURITY LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌─────────────────────────────────────────────────────────┐
│  │ WAF (Web Application Firewall)                          │
│  │ - DDoS Protection                                       │
│  │ - Rate Limiting                                         │
│  │ - IP Filtering                                          │
│  └─────────────────────┬───────────────────────────────────┘
│                        │
├─────────────────────────────────────────────────────────────────┤
│                    API GATEWAY / REVERSE PROXY                   │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌─────────────────────────────────────────────────────────┐
│  │ Express.js / Node.js Server                             │
│  │                                                         │
│  │  MIDDLEWARE STACK (in order):                          │
│  │  1. Helmet.js (Security Headers)                       │
│  │  2. CORS Validation (Origin Check)                     │
│  │  3. Body Parser (JSON Parsing)                         │
│  │  4. Request Logging (All requests)                     │
│  │  5. Security Middleware:                               │
│  │     - Input Sanitization (xss)                         │
│  │     - Phishing Detection                               │
│  │     - IP Filter Check                                  │
│  │     - Security Logging                                 │
│  │  6. Rate Limiting (Endpoint specific)                  │
│  │  7. CSRF Token Validation                              │
│  │  8. Authentication Check (JWT)                         │
│  │                                                         │
│  │  ROUTE HANDLERS:                                        │
│  │  ├─ POST /api/auth/register                            │
│  │  ├─ POST /api/auth/login                               │
│  │  ├─ POST /api/auth/refresh                             │
│  │  ├─ POST /api/trips (User)                             │
│  │  ├─ GET  /api/trips (User)                             │
│  │  ├─ GET  /api/trips/:id                                │
│  │  ├─ PUT  /api/trips/:id                                │
│  │  ├─ POST /api/trips/:id/submit-approval                │
│  │  ├─ POST /api/trips/:id/approve (Admin)                │
│  │  ├─ POST /api/trips/:id/reject (Admin)                 │
│  │  ├─ GET  /api/notifications                            │
│  │  ├─ PUT  /api/notifications/:id/read                   │
│  │  ├─ POST /api/notifications/read-all                   │
│  │  ├─ GET  /api/admin/settings/users (Admin)             │
│  │  ├─ POST /api/admin/settings/maintenance-mode (Admin)  │
│  │  ├─ POST /api/admin/settings/alerts/send (Admin)       │
│  │  └─ GET  /api/admin/settings/audit-logs (Admin)        │
│  │                                                         │
│  │  Controllers:                                           │
│  │  ├─ secureAuthController.js (Authentication)           │
│  │  ├─ notificationController.js (Notifications)          │
│  │  ├─ tripController.js (Trip Planning)                  │
│  │  └─ adminSettingsController.js (Admin Functions)       │
│  └─────────────────────┬───────────────────────────────────┘
│                        │
├─────────────────────────────────────────────────────────────────┤
│                   BUSINESS LOGIC LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌────────────────────────────────────────────────────────┐
│  │ Workflow Engines & Processors                          │
│  │                                                         │
│  │ ┌─────────────────────────────────────────────────┐   │
│  │ │ Trip Approval Workflow                          │   │
│  │ │ ├─ User creates trip (DRAFT)                    │   │
│  │ │ ├─ User submits (PENDING_APPROVAL)              │   │
│  │ │ ├─ Admin reviews                                │   │
│  │ │ ├─ Admin approves (APPROVED)                    │   │
│  │ │ └─ User can now book                            │   │
│  │ │   OR                                             │   │
│  │ │ └─ Admin rejects with reason (REJECTED)         │   │
│  │ │    └─ User receives rejection notification       │   │
│  │ └─────────────────────────────────────────────────┘   │
│  │                                                         │
│  │ ┌─────────────────────────────────────────────────┐   │
│  │ │ Notification Trigger System                      │   │
│  │ │ ├─ On signup: Welcome notification              │   │
│  │ │ ├─ On login: Login recorded                      │   │
│  │ │ ├─ On trip create: Notification sent             │   │
│  │ │ ├─ On trip submit: Admin notified                │   │
│  │ │ ├─ On trip approve: User notified                │   │
│  │ │ ├─ On trip reject: User notified + reason        │   │
│  │ │ ├─ On maintenance: All users alerted             │   │
│  │ │ └─ On system alert: All users notified           │   │
│  │ └─────────────────────────────────────────────────┘   │
│  │                                                         │
│  │ ┌─────────────────────────────────────────────────┐   │
│  │ │ Authentication & Authorization Logic             │   │
│  │ │ ├─ Password validation (strength check)          │   │
│  │ │ ├─ Bcrypt hashing (10 rounds ≈ 100ms)           │   │
│  │ │ ├─ JWT token generation (15min + 7day)          │   │
│  │ │ ├─ Token verification                           │   │
│  │ │ ├─ Role-based access control                    │   │
│  │ │ ├─ Account lockout logic (5 attempts)           │   │
│  │ │ └─ Password reset token handling                │   │
│  │ └─────────────────────────────────────────────────┘   │
│  └────────────────────────────────────────────────────────┘
│                        │
├─────────────────────────────────────────────────────────────────┤
│                   DATA ACCESS LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌────────────────────────────────────────────────────────┐
│  │ Database Abstraction Layer (pg library)                │
│  │                                                         │
│  │ Connection Pool:                                        │
│  │ ├─ Min connections: 2                                  │
│  │ ├─ Max connections: 10                                 │
│  │ └─ Idle timeout: 30 seconds                            │
│  │                                                         │
│  │ Parameterized Query Execution:                         │
│  │ ├─ SQL code separated from data                        │
│  │ ├─ Prevents SQL injection attacks                      │
│  │ ├─ Automatic escaping of special chars                 │
│  │ └─ Query result parsing & validation                   │
│  │                                                         │
│  │ Transaction Management:                                │
│  │ ├─ BEGIN/COMMIT/ROLLBACK support                       │
│  │ ├─ Atomic operations for critical flows                │
│  │ └─ Ensures data consistency                            │
│  └─────────────────────┬───────────────────────────────────┘
│                        │
├─────────────────────────────────────────────────────────────────┤
│                     DATABASE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌────────────────────────────────────────────────────────┐
│  │ PostgreSQL Database (Neon)                             │
│  │                                                         │
│  │ TABLES & SCHEMAS:                                       │
│  │                                                         │
│  │ ┌─ users                                              │
│  │ │  ├─ id (PRIMARY KEY)                                │
│  │ │  ├─ email (UNIQUE)                                  │
│  │ │  ├─ password_hash (bcryptjs)                        │
│  │ │  ├─ first_name, last_name                           │
│  │ │  ├─ role (user, admin)                              │
│  │ │  ├─ status (active, suspended)                      │
│  │ │  ├─ email_verified (boolean)                        │
│  │ │  ├─ created_at, updated_at                          │
│  │ │  └─ INDEX: email, role, created_at                  │
│  │ │                                                      │
│  │ ├─ trips                                              │
│  │ │  ├─ id (PRIMARY KEY)                                │
│  │ │  ├─ user_id (FOREIGN KEY → users)                  │
│  │ │  ├─ name                                            │
│  │ │  ├─ start_date, end_date                            │
│  │ │  ├─ budget, currency                                │
│  │ │  ├─ status (draft, pending_approval, etc)           │
│  │ │  ├─ rejection_reason                                │
│  │ │  ├─ created_at, updated_at                          │
│  │ │  └─ INDEX: user_id, status, created_at              │
│  │ │                                                      │
│  │ ├─ notifications                                      │
│  │ │  ├─ id (PRIMARY KEY)                                │
│  │ │  ├─ user_id (FOREIGN KEY → users)                  │
│  │ │  ├─ title, message                                  │
│  │ │  ├─ type (booking, trip, system, promo)             │
│  │ │  ├─ channel (in_app, email, sms)                    │
│  │ │  ├─ read (boolean)                                  │
│  │ │  ├─ created_at, updated_at                          │
│  │ │  └─ INDEX: user_id, read, created_at                │
│  │ │                                                      │
│  │ ├─ audit_logs                                         │
│  │ │  ├─ id (PRIMARY KEY)                                │
│  │ │  ├─ actor_id (FOREIGN KEY → users)                 │
│  │ │  ├─ action (reset_password, suspend, etc)           │
│  │ │  ├─ resource_type (users, trips, system)            │
│  │ │  ├─ resource_id (optional)                          │
│  │ │  ├─ ip_address                                      │
│  │ │  ├─ created_at                                      │
│  │ │  └─ INDEX: actor_id, action, created_at             │
│  │ │                                                      │
│  │ ├─ admin_settings                                     │
│  │ │  ├─ id (PRIMARY KEY)                                │
│  │ │  ├─ key (maintenance_mode, alert_message)           │
│  │ │  ├─ value (JSON)                                    │
│  │ │  ├─ updated_at                                      │
│  │ │  └─ INDEX: key                                      │
│  │ │                                                      │
│  │ ├─ account_lockouts                                   │
│  │ │  ├─ id (PRIMARY KEY)                                │
│  │ │  ├─ user_id (FOREIGN KEY → users)                  │
│  │ │  ├─ locked_until (timestamp)                        │
│  │ │  └─ INDEX: user_id, locked_until                    │
│  │ │                                                      │
│  │ ├─ login_attempts                                     │
│  │ │  ├─ id (PRIMARY KEY)                                │
│  │ │  ├─ email                                           │
│  │ │  ├─ ip_address                                      │
│  │ │  ├─ success (boolean)                               │
│  │ │  ├─ created_at                                      │
│  │ │  └─ INDEX: email, ip_address, created_at            │
│  │ │                                                      │
│  │ ├─ ip_blacklist                                       │
│  │ │  ├─ id (PRIMARY KEY)                                │
│  │ │  ├─ ip_address                                      │
│  │ │  ├─ reason                                          │
│  │ │  ├─ blacklisted_at, blacklisted_until               │
│  │ │  └─ INDEX: ip_address                               │
│  │ │                                                      │
│  │ └─ suspicious_activities                              │
│  │    ├─ id (PRIMARY KEY)                                │
│  │    ├─ type (sql_injection, phishing, etc)             │
│  │    ├─ details (JSON)                                  │
│  │    ├─ ip_address                                      │
│  │    ├─ created_at                                      │
│  │    └─ INDEX: type, ip_address, created_at             │
│  │                                                         │
│  │ DATABASE FEATURES:                                     │
│  │ ├─ Row Level Security (RLS) ready                      │
│  │ ├─ Automated backups (daily)                           │
│  │ ├─ Connection pooling                                  │
│  │ ├─ Query optimization indexes                          │
│  │ └─ Transaction support                                 │
│  └────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### User Registration Flow
```
┌─────────────┐
│ User enters │
│ credentials │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Frontend validates locally       │
│ - Password strength              │
│ - Email format                   │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ POST /api/auth/register          │
│ + X-CSRF-Token header            │
│ + email, password, name          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Server: Validate CSRF token      │
│ Server: Sanitize input (xss)     │
│ Server: Validate password        │
│ Server: Check email not in use   │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Hash password with bcryptjs      │
│ (10 rounds ≈ 100ms)              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ INSERT INTO users (email, pass)  │
│ (Parameterized query)            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Send welcome notification        │
│ INSERT INTO notifications        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Log audit event                  │
│ INSERT INTO audit_logs           │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│ Return 200:  │
│ success: true│
└──────────────┘
```

### Trip Approval Workflow
```
┌─────────────────────────┐
│ User creates trip       │
│ POST /api/trips         │
│ Status: DRAFT           │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Trip saved to database           │
│ INSERT INTO trips                │
│ Notification: Trip created       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ User submits for approval        │
│ POST /api/trips/:id/submit       │
│ Status: PENDING_APPROVAL         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Trip updated in database         │
│ UPDATE trips SET status          │
│ Notification: Submitted for      │
│ approval (to user + admins)      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Admin dashboard shows pending    │
│ GET /api/trips/admin/pending     │
└──────┬──────────────────────────┘
       │
       ├──────────────────────┬────────────────────────┐
       │                      │                        │
       ▼                      ▼                        ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Admin approves   │  │ Admin rejects     │  │ Admin reviews    │
│ POST .../approve │  │ POST .../reject   │  │ details          │
│                  │  │ + rejection_reason│  │ GET .../details  │
└────────┬─────────┘  └────────┬──────────┘  └──────────────────┘
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────────┐
│ Status: APPROVED │  │ Status: REJECTED     │
│                  │  │ + rejection_reason   │
│ Trip becomes     │  │                      │
│ available to     │  │ User notified of     │
│ book             │  │ rejection + reason   │
│                  │  │                      │
│ User notified    │  │ User can edit and    │
│ with approval    │  │ resubmit             │
└────────┬─────────┘  └────────┬─────────────┘
         │                     │
         ▼                     ▼
┌──────────────────────────────────┐
│ Audit log entry created          │
│ INSERT INTO audit_logs           │
│ actor_id, action, resource_id    │
└──────────────────────────────────┘
```

### Authentication & Authorization Flow
```
┌──────────────────────┐
│ User login request   │
│ POST /api/auth/login │
│ email, password      │
└──────┬───────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Check rate limiting                │
│ SELECT COUNT(*) FROM login_attempts│
│ WHERE email = $1 AND ip = $2       │
│ AND created_at > NOW() - 15min     │
└──────┬─────────────────────────────┘
       │
       ├─ Count >= 5? ──┐
       │                │
       │ YES            │ NO
       │                ▼
       │           ┌───────────────────────┐
       │           │ Find user by email    │
       │           │ SELECT * FROM users   │
       │           │ WHERE email = $1      │
       │           └──────┬────────────────┘
       │                  │
       │          ┌───────┴─────────┐
       │          │                 │
       │ User   User               No User
       │ not     found             found
       │ found    │                 │
       │  │       ▼                 │
       │  │ ┌────────────────────┐  │
       │  │ │ Compare password:  │  │
       │  │ │ bcrypt.compare(    │  │
       │  │ │   password,        │  │
       │  │ │   hash_from_db     │  │
       │  │ │ )                  │  │
       │  │ └─┬────────┬─────────┘  │
       │  │   │        │            │
       │  │   │     MISMATCH        │
       │  │   │        │            │
       │  │   │        ▼            │
       │  ▼   ▼   ┌────────────┐    │
       │  ┌────────┤ Log failed │    │
       │  │        │ attempt    │    │
       │  │        │ DELETE if  │    │
       │  │        │ 5 attempts │    │
       │  │        └────────────┘    │
       │  │                          │
       │  └──────────┬───────────────┘
       │             │
       ▼             ▼
┌──────────────────────────────────┐
│ Return 401: Unauthorized         │
│ {                                │
│   error: "Invalid email or       │
│   password"                      │
│ }                                │
└──────────────────────────────────┘

       ▲
       │
       └─── Only if rate limit exceeded:
            Return 429: Too Many Requests

SUCCESS PATH (password matches):
       ▼
┌──────────────────────────────────┐
│ Generate JWT tokens              │
│ Access token: 15 minute expiry    │
│ Refresh token: 7 day expiry       │
│                                  │
│ const token = jwt.sign({         │
│   userId: user.id,               │
│   role: user.role                │
│ }, process.env.JWT_SECRET, {     │
│   expiresIn: '15m'               │
│ })                               │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Log successful login              │
│ INSERT INTO login_attempts        │
│ email, ip, success=true, NOW()    │
│                                  │
│ INSERT INTO audit_logs            │
│ actor_id, action='LOGIN'          │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Return 200: Success              │
│ {                                │
│   success: true,                 │
│   token: "access_token",         │
│   refreshToken: "refresh_token", │
│   user: {id, email, role}        │
│ }                                │
└──────────────────────────────────┘
```

### Security Middleware Chain
```
REQUEST
   │
   ▼
┌────────────────────────────┐
│ 1. Helmet Headers          │
│ - CSP, HSTS, X-Frame-Options│
│ - NoSniff, XSSFilter       │
└────┬─────────────────────────┘
     │
     ▼
┌────────────────────────────┐
│ 2. CORS Validation         │
│ - Check Origin header      │
│ - Match against whitelist  │
│ - Block if not allowed     │
└────┬─────────────────────────┘
     │
     ▼
┌────────────────────────────┐
│ 3. Body Parser             │
│ - Parse JSON               │
│ - Size limit: 10MB         │
│ - Validate JSON structure  │
└────┬─────────────────────────┘
     │
     ▼
┌────────────────────────────┐
│ 4. Request Logging         │
│ - Log all incoming requests│
│ - Track response time      │
│ - Monitor error codes      │
└────┬─────────────────────────┘
     │
     ▼
┌────────────────────────────┐
│ 5. Security Middleware     │
│ - Sanitize input (xss)     │
│ - Phishing detection       │
│ - IP filtering             │
│ - Security logging         │
└────┬─────────────────────────┘
     │
     ▼
┌────────────────────────────┐
│ 6. Rate Limiting           │
│ - Check endpoint limits    │
│ - Enforce request quota    │
│ - Block if exceeded        │
└────┬─────────────────────────┘
     │
     ▼
┌────────────────────────────┐
│ 7. CSRF Validation         │
│ - Verify X-CSRF-Token      │
│ - Match against session    │
│ - Block if invalid/missing │
└────┬─────────────────────────┘
     │
     ▼
┌────────────────────────────┐
│ 8. Authentication          │
│ - Check Authorization hdr  │
│ - Verify JWT token         │
│ - Extract user info        │
└────┬─────────────────────────┘
     │
     ▼
ROUTE HANDLER
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Security**: bcryptjs, jsonwebtoken, xss, helmet, cors
- **Rate Limiting**: express-rate-limit
- **HTTP Client**: axios

### Frontend
- **Framework**: React 18+
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **HTTP Client**: axios
- **State**: React Hooks / SWR

### Infrastructure (Deployment-Ready)
- **Hosting**: Vercel / Railway / AWS
- **Database**: Neon PostgreSQL
- **SSL**: Let's Encrypt / Cloudflare
- **CDN**: Cloudflare / Vercel Edge
- **Monitoring**: Application Performance Monitoring (APM)
- **Logging**: ELK Stack / CloudWatch

---

## Security Boundary Diagram

```
┌──────────────────────────────────────────────────────┐
│                   INTERNET                            │
│                   (Untrusted)                         │
└────────────────┬─────────────────────────────────────┘
                 │ HTTPS (Encrypted)
                 │ No credentials in URL
                 │
┌────────────────▼─────────────────────────────────────┐
│               FIREWALL / WAF                          │
│   Block malicious IPs, DDoS, known attack patterns   │
└────────────────┬─────────────────────────────────────┘
                 │
                 │ Requests authenticated
                 │ Rate limited
                 │
┌────────────────▼─────────────────────────────────────┐
│            API GATEWAY (Express.js)                   │
│                                                       │
│  Rate Limiting     CSRF Validation     Input Sanitize│
│  JWT Verification  CORS Check          XSS Prevention│
└────────────────┬─────────────────────────────────────┘
                 │
                 │ Trusted requests only
                 │ User identity verified
                 │ Action authorized
                 │
┌────────────────▼─────────────────────────────────────┐
│          BUSINESS LOGIC LAYER                         │
│                                                       │
│  Role-based access control (RBAC)                     │
│  Resource ownership verification                      │
│  Workflow validation                                  │
└────────────────┬─────────────────────────────────────┘
                 │
                 │ Verified safe data
                 │ SQL parameterized
                 │
┌────────────────▼─────────────────────────────────────┐
│         DATABASE (PostgreSQL)                         │
│                                                       │
│  Data encrypted at rest (design-ready)                │
│  Row-level security (RLS) ready                       │
│  Transactions ensure consistency                      │
│  Backups automated daily                              │
└──────────────────────────────────────────────────────┘
```

---

## Scalability Architecture

### Current Setup (Single Server)
```
Client ──HTTPS──> Express Server ──SQL──> PostgreSQL
                       ↓
                  In-Memory JWT
                   Verification
```

### Horizontal Scaling (Future)
```
                    Load Balancer
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    Server 1          Server 2          Server 3
    Port: 5001        Port: 5002        Port: 5003
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    PostgreSQL
                  (Connection Pool)
                          │
                      Redis Cache
                    (Optional, future)
```

### Caching Strategy (Design)
```
Client Request
    ↓
Check Redis Cache
    ├─ HIT: Return cached response
    │
    └─ MISS: Query Database
           ↓
        Get Data
        ↓
        Cache for 5-60 minutes
        ↓
        Return to Client
```

---

## Summary

This architecture provides:

✅ **Security**: Multi-layer protection against OWASP Top 10  
✅ **Scalability**: Horizontal scaling ready  
✅ **Reliability**: Transaction support, backups, error handling  
✅ **Performance**: Indexed queries, connection pooling, caching ready  
✅ **Monitoring**: Comprehensive logging and audit trails  
✅ **Maintainability**: Clear separation of concerns, documented code  

The system is production-ready and designed to handle growth from thousands to millions of requests per day.
