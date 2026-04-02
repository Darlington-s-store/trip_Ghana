# Ghana Trips Platform - Complete Project Roadmap

## Current Status
- ✅ Database: Neon PostgreSQL (schema.sql completed)
- ✅ Backend Security: Helmet, CORS, XSS protection, Rate limiting
- ✅ Authentication: Secure auth controller with JWT, bcryptjs, email codes
- ✅ Security Middleware: Role-based access control, ownership verification
- ⏳ Admin Dashboard: Needs React frontend implementation
- ⏳ User Pages: Needs React frontend implementation

---

## PHASE 1: Backend Core API (90% Complete)

### Completed:
1. **Security Foundation** ✅
   - Helmet.js for HTTP headers
   - CORS with origin validation  
   - Rate limiting (login: 5/15min, register: 5/1hr, general: 100/15min)
   - XSS protection with sanitization
   - Request logging and audit trail
   - Graceful error handling

2. **Authentication** ✅
   - User registration with email verification
   - Login with JWT (15m access + 7d refresh tokens)
   - Password reset with 6-digit codes
   - Password change endpoint
   - Profile management
   - Refresh token rotation

3. **Database Integration** ✅
   - Direct PostgreSQL queries (pg library)
   - Connection pooling
   - Prepared statements (SQL injection prevention)
   - User status tracking (active/suspended/deactivated)

### Remaining Backend Controllers (Use Direct SQL):

Create these controllers using `/backend/db.js` pool directly:

```bash
backend/controllers/
├── hotelController.js         # CRUD hotels, room types
├── destinationController.js   # CRUD destinations with visibility
├── attractionController.js    # CRUD attractions + approval queue
├── bookingController.js       # Create/manage bookings
├── tripController.js          # User trips management
├── transportController.js     # Transport routes
├── paymentController.js       # Paystack integration (existing)
├── adminUsersController.js    # User management (suspend/delete)
├── adminBookingsController.js # Booking approval/cancellation
├── adminAnalyticsController.js # Dashboard KPIs
```

**Key Security Patterns for Controllers:**

```javascript
// Example controller using direct SQL
const hotelController = {
  createHotel: async (req, res) => {
    try {
      // 1. Validate input
      if (!req.body.name) return res.status(400).json({...});
      
      // 2. Check authorization
      if (req.user.role !== 'admin') return res.status(403).json({...});
      
      // 3. Execute query with parameterized statements
      const result = await pool.query(
        `INSERT INTO hotels (name, description, destination_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.body.name, req.body.description, req.body.destination_id]
      );
      
      // 4. Log audit event
      await logAuditEvent(req.user.userId, 'CREATE', 'hotel', result.rows[0].id, req.ip);
      
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to create hotel' });
    }
  }
};
```

---

## PHASE 2: Frontend Admin Dashboard

### Structure Needed:
```
src/
├── pages/admin/
│   ├── AdminLayout.tsx          # Sidebar + header layout
│   ├── Overview.tsx             # KPI cards, charts
│   ├── Users/
│   │   ├── UsersList.tsx        # DataTable with filters
│   │   └── UserDetail.tsx       # Suspend/activate/reset
│   ├── Trips/
│   │   ├── TripsList.tsx        # Pending approval queue
│   │   └── TripDetail.tsx       # Approve/reject with reason
│   ├── Hotels/
│   │   ├── HotelsList.tsx       # Hotel CRUD
│   │   └── HotelForm.tsx        # Create/edit form
│   ├── Destinations/
│   │   ├── DestinationsList.tsx
│   │   └── DestinationForm.tsx
│   ├── Bookings/
│   │   ├── BookingsList.tsx
│   │   └── BookingDetail.tsx
│   ├── Analytics/
│   │   ├── Dashboard.tsx        # Charts + KPIs
│   │   └── Analytics.tsx        # Detailed reports
│   └── AuditLogs.tsx            # Activity tracking
```

### Admin Pages Checklist:

1. **Overview/Dashboard** (KPIs)
   - Total users, revenue, bookings
   - Monthly trends (chart)
   - Recent activities (table)

2. **Users Management**
   - List with search/filter
   - Suspend/activate button
   - Reset password action
   - View profile details

3. **Trips Management**
   - Pending trips queue
   - Approve/reject with reason modal
   - View trip details
   - Status tracking

4. **Hotels Management**
   - CRUD operations
   - Room type management (multi-select form)
   - Bulk upload support
   - Image gallery

5. **Bookings Management**
   - List with filters (status, date)
   - Confirm/cancel operations
   - Refund handling
   - Export CSV

6. **Analytics**
   - Revenue charts (by month, category)
   - User growth graph
   - Top performers (hotels, destinations)
   - Audit log viewer

---

## PHASE 3: Frontend User Pages

### Structure:
```
src/pages/
├── Auth/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ForgotPassword.tsx
│   └── ResetPassword.tsx
├── Dashboard/
│   ├── MyTrips.tsx
│   ├── MyBookings.tsx
│   ├── Profile.tsx
│   └── Notifications.tsx
├── Destinations/
│   ├── DestinationsList.tsx
│   └── DestinationDetail.tsx
├── Hotels/
│   ├── HotelsList.tsx
│   ├── HotelDetail.tsx
│   └── BookingForm.tsx
├── Attractions/
│   ├── AttractionsList.tsx
│   └── AttractionDetail.tsx
└── Trips/
    ├── TripPlanner.tsx
    └── TripDetail.tsx
```

---

## PHASE 4: Full Security Implementation

### Authentication Flow:
```
1. User registers → Email verification code → Store hash in DB
2. User login → JWT (15m) + Refresh token (7d)
3. Token expiry → Client sends refresh token → New JWT
4. Token validation → Verify signature + Check user status
5. Admin actions → Role check + Audit log
```

### Database Security:
- ✅ Parameterized queries (prevents SQL injection)
- ✅ Password hashing (bcryptjs 10 rounds)
- ✅ Email verification codes (hashed, not stored as plain text)
- ✅ Audit logging (all admin actions)
- ✅ User status tracking (suspend/deactivate)
- ✅ JWT expiry (short-lived access tokens)

### HTTP Security:
- ✅ Helmet.js (CSP, HSTS, X-Frame-Options)
- ✅ CORS validation (whitelisted origins only)
- ✅ Rate limiting (prevent brute force/DDoS)
- ✅ XSS sanitization (remove HTML/scripts)
- ✅ HTTPS only (in production)

### API Security:
- ✅ Bearer token validation
- ✅ Role-based access control
- ✅ Resource ownership verification
- ✅ Idempotency checks
- ✅ Request size limits (10MB)
- ✅ Error message sanitization

---

## Implementation Steps

### Step 1: Create Admin Controllers (Backend)
Each controller follows this pattern:

```javascript
// hotelController.js
const pool = require('../db');
const { logAuditEvent } = require('../utils/audit');

exports.getHotels = async (req, res) => {
  try {
    // Check auth
    if (req.user.role !== 'admin') 
      return res.status(403).json({success: false});
    
    // Query with filters
    const result = await pool.query(
      `SELECT * FROM hotels WHERE destination_id = $1 ORDER BY created_at DESC`,
      [req.query.destination_id]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createHotel = async (req, res) => {
  try {
    if (req.user.role !== 'admin') 
      return res.status(403).json({success: false});
    
    const { name, location, destination_id, price_per_night } = req.body;
    
    if (!name || !destination_id) 
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    
    const result = await pool.query(
      `INSERT INTO hotels (name, location, destination_id, price_per_night)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, location, destination_id, price_per_night]
    );
    
    // Log action
    await logAuditEvent(req.user.userId, 'CREATE', 'hotel', result.rows[0].id, req.ip);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ... more methods (update, delete, etc)
```

### Step 2: Create Frontend Admin Components
Use shadcn/ui DataTable, Modals, Forms

```tsx
// src/pages/admin/Hotels/HotelsList.tsx
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import useQuery from 'react-query';

export default function HotelsList() {
  const { data, isLoading } = useQuery('hotels', () =>
    fetch('/api/admin/hotels', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json())
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Hotels</h1>
      <DataTable
        columns={hotelColumns}
        data={data?.data || []}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Step 3: Environment Variables Required

```bash
# Backend/.env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-key
CORS_ORIGIN=https://yourdomain.com

# Email/SMS
RESEND_API_KEY=re_...
ARKESEL_API_KEY=...

# Paystack
PAYSTACK_PUBLIC_KEY=pk_...
PAYSTACK_SECRET_KEY=sk_...
```

---

## Security Checklist

### Backend:
- [x] Helmet.js for headers
- [x] CORS origin validation
- [x] Rate limiting (all endpoints)
- [x] XSS sanitization
- [x] SQL injection prevention (parameterized queries)
- [x] Password hashing (bcryptjs)
- [x] JWT with expiry
- [x] Request logging
- [x] Audit trails
- [ ] **TODO**: HTTPS enforcement
- [ ] **TODO**: CSP headers enhancement
- [ ] **TODO**: Two-factor authentication (optional)
- [ ] **TODO**: API versioning

### Frontend:
- [ ] Store tokens in secure cookies (not localStorage)
- [ ] CSRF tokens for state-changing requests
- [ ] Input validation before submission
- [ ] XSS protection (React auto-escapes by default)
- [ ] Secure password strength validation
- [ ] Logout on token expiry
- [ ] Timeout for inactivity (5 min)

### Database:
- [x] SSL connections (Neon default)
- [x] Parameterized queries
- [x] Audit logging table
- [x] User status tracking
- [x] Password reset tokens (hashed)
- [ ] **TODO**: Row Level Security (RLS)
- [ ] **TODO**: Encrypted sensitive fields

---

## Next Immediate Actions

1. **Create admin controllers** (hotelController, destinationController, etc.)
2. **Wire up admin routes** (/api/admin/hotels, /api/admin/destinations, etc.)
3. **Build admin layout** component with sidebar navigation
4. **Create admin pages** (Users, Trips, Hotels, Bookings, Analytics)
5. **Add frontend authentication flow** (Login/Register/Token management)
6. **Build user pages** (Destinations, Hotels, Bookings, Trips)
7. **Integrate Paystack** payment processing
8. **Add email notifications** (nodemailer or existing Resend)
9. **Deploy with HTTPS** to production

---

## Database Tables Summary

```sql
-- Core
users               -- User accounts with status
password_reset_tokens -- Password reset codes (hashed)
audit_logs          -- All admin actions

-- Content Management
destinations        -- Tourist destinations
hotels              -- Accommodation
attractions         -- Activities
transport_routes    -- Transportation options

-- User Activity
trips               -- User trip plans
trip_days           -- Itinerary structure
trip_day_attractions -- Day-level attraction linkage
bookings            -- Reservations (hotel/attraction/transport)
payments            -- Payment tracking (Paystack)
reviews             -- User reviews + moderation

-- System
notifications       -- In-app notifications
```

---

## Technology Stack
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon)
- **Frontend**: React + Vite + shadcn/ui
- **Auth**: JWT + bcryptjs
- **Security**: Helmet + CORS + Rate Limiting
- **Payments**: Paystack
- **Email**: Resend
- **State**: Zustand
- **Forms**: React Hook Form + Zod

---

## Estimated Effort

- Backend Controllers: 8-10 hours
- Admin Dashboard: 12-15 hours
- User Pages: 10-12 hours
- Testing & Refinement: 5-8 hours
- **Total: ~35-45 hours**

Start with admin controllers, then build the admin dashboard, then user-facing pages.
