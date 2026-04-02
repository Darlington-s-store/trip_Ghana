# Quick Start Guide - Complete the Project

## What's Already Done ✅

### Backend
- ✅ Secure server.js with Helmet, CORS, XSS protection, Rate limiting
- ✅ Authentication controller (register, login, password reset)
- ✅ Secure auth middleware (role checks, ownership verification)
- ✅ Hotels controller (CRUD + admin features)
- ✅ Database connection (PostgreSQL with prepared statements)
- ✅ Audit logging (all admin actions tracked)
- ✅ User status tracking (active/suspended/deactivated)

### Frontend
- ✅ Admin Hotels management page (CRUD example)

---

## Steps to Complete the Project

### STEP 1: Create Remaining Backend Controllers (2-3 hours)

Copy the `hotelController.js` pattern and create these:

```bash
backend/controllers/
├── destinationController.js    # getDestinations, createDestination, etc.
├── attractionController.js     # CRUD + approval queue
├── tripController.js           # User trips management
├── bookingController.js        # Booking CRUD
├── transportController.js      # Routes CRUD
├── adminUsersController.js     # User management (suspend/delete/reset password)
├── adminAnalyticsController.js # Dashboard KPIs (revenue, users, bookings)
└── paymentController.js        # Paystack integration (already exists)
```

**Key Pattern:**
```javascript
// Each controller follows this:
const { authenticateToken, requireAdmin } = require('../middleware/secureAuth');

exports.getItems = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM table_name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createItem = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({success: false});
    
    const result = await pool.query(
      'INSERT INTO table_name (col1, col2) VALUES ($1, $2) RETURNING *',
      [req.body.col1, req.body.col2]
    );
    
    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.userId, 'CREATE', 'table_name', result.rows[0].id, req.ip]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

### STEP 2: Create Admin Routes (1 hour)

Create `backend/routes/admin.js`:

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/secureAuth');

// Apply auth check to all admin routes
router.use(authenticateToken, requireAdmin);

// Hotels
const hotelController = require('../controllers/hotelController');
router.get('/hotels', hotelController.getHotels);
router.get('/hotels/:id', hotelController.getHotel);
router.post('/hotels', hotelController.createHotel);
router.put('/hotels/:id', hotelController.updateHotel);
router.delete('/hotels/:id', hotelController.deleteHotel);
router.get('/hotels/stats', hotelController.getStats);

// Destinations - follow same pattern
const destinationController = require('../controllers/destinationController');
router.get('/destinations', destinationController.getDestinations);
router.post('/destinations', destinationController.createDestination);
// ... etc

// Users
const adminUsersController = require('../controllers/adminUsersController');
router.get('/users', adminUsersController.listUsers);
router.put('/users/:id/suspend', adminUsersController.suspendUser);
router.put('/users/:id/activate', adminUsersController.activateUser);
// ... etc

module.exports = router;
```

Then update `server.js` to use it (already done ✅).

### STEP 3: Build Admin Dashboard Pages (4-5 hours)

Create in `src/pages/admin/`:

```
Admin/
├── AdminLayout.tsx       # Main layout with sidebar
├── AdminOverview.tsx     # Dashboard with KPI cards + charts
├── Hotels/
│   └── HotelsList.tsx    # Already created ✅
├── Destinations/
│   └── DestinationsList.tsx
├── Users/
│   └── UsersList.tsx     # View users, suspend, activate, reset password
├── Trips/
│   └── TripsList.tsx     # Approve/reject trips
├── Bookings/
│   └── BookingsList.tsx  # View, confirm, cancel
└── Analytics/
    └── Dashboard.tsx     # Charts with revenue, users, bookings
```

**Example Admin Layout:**
```tsx
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';

export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### STEP 4: Build User-Facing Pages (3-4 hours)

Create in `src/pages/`:

```
pages/
├── Auth/
│   ├── Login.tsx         # Login form + JWT storage
│   ├── Register.tsx      # Registration form
│   └── ForgotPassword.tsx
├── Dashboard/
│   ├── MyTrips.tsx       # User's trips
│   ├── MyBookings.tsx    # User's bookings
│   └── Profile.tsx       # Edit profile
├── Destinations/
│   ├── DestinationsList.tsx
│   └── DestinationDetail.tsx
├── Hotels/
│   ├── HotelsList.tsx
│   ├── HotelDetail.tsx
│   └── BookingForm.tsx   # Create booking
└── Attractions/
    ├── AttractionsList.tsx
    └── AttractionDetail.tsx
```

### STEP 5: Setup Authentication Flow (1-2 hours)

Create `src/hooks/useAuth.ts`:

```typescript
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export function useAuth() {
  const navigate = useNavigate();

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      // Store tokens
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.accessToken}`;

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  }, [navigate]);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post('http://localhost:5000/api/auth/refresh', {
        refreshToken,
      });

      localStorage.setItem('accessToken', response.data.data.accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.accessToken}`;

      return response.data.data.accessToken;
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  // Setup axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            await refreshAccessToken();
            return axios(error.config);
          } catch {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshAccessToken, logout]);

  return { login, logout, refreshAccessToken };
}
```

### STEP 6: Setup Routing (1 hour)

Create `src/routes/index.tsx`:

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import Dashboard from '@/pages/Dashboard';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import HotelsAdmin from '@/pages/admin/Hotels';

function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* User */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route path="overview" element={<AdminOverview />} />
        <Route path="hotels" element={<HotelsAdmin />} />
        {/* Add other admin pages */}
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
```

---

## Environment Variables Setup

### Backend (.env)
```
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:password@host/neondb?sslmode=require
JWT_SECRET=your-very-secure-secret-key-change-this
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com

# Email
RESEND_API_KEY=re_xxx

# SMS
ARKESEL_API_KEY=xxx

# Payments
PAYSTACK_PUBLIC_KEY=pk_xxx
PAYSTACK_SECRET_KEY=sk_xxx
```

### Frontend (.env)
```
VITE_API_BASE=http://localhost:5000/api
```

---

## Security Checklist

### ✅ Implemented
- [x] Helmet.js (CSP, HSTS, X-Frame-Options)
- [x] CORS origin validation
- [x] Rate limiting
- [x] XSS sanitization
- [x] SQL injection prevention (parameterized queries)
- [x] Password hashing (bcryptjs)
- [x] JWT with expiry
- [x] Audit logging
- [x] User status tracking

### 📋 Todo
- [ ] Secure httpOnly cookies for tokens
- [ ] CSRF tokens (optional if using SPA)
- [ ] API versioning (/api/v1/)
- [ ] Two-factor authentication (optional)
- [ ] Input validation schemas (Zod/Joi)
- [ ] Rate limiting per user ID
- [ ] HTTPS in production
- [ ] Content Security Policy enhancement

---

## Testing Checklist

### Authentication
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Reject invalid credentials
- [ ] Token expiry and refresh
- [ ] Logout clears tokens

### Hotels (Admin)
- [ ] Create hotel
- [ ] List hotels with pagination
- [ ] Update hotel details
- [ ] Delete hotel (soft delete)
- [ ] Verify audit log entry

### User Features
- [ ] Browse destinations
- [ ] View hotel details
- [ ] Create booking
- [ ] View my bookings
- [ ] Cancel booking

### Admin Features
- [ ] View all users
- [ ] Suspend user
- [ ] Activate user
- [ ] View analytics dashboard
- [ ] Approve trip

---

## Deployment Checklist

### Before Production
- [ ] Change JWT_SECRET to strong random string
- [ ] Set NODE_ENV=production
- [ ] Update CORS_ORIGIN to actual domain
- [ ] Enable HTTPS
- [ ] Setup database backups
- [ ] Configure email service
- [ ] Setup error monitoring (Sentry optional)
- [ ] Enable request logging
- [ ] Test payment flow (Paystack sandbox)

### Hosting Options
- **Backend**: Vercel, Render, Railway, Heroku
- **Database**: Neon (already using)
- **Frontend**: Vercel, Netlify

---

## Database Schema Reference

```sql
-- Users (with role-based access)
users (id, email, password, first_name, last_name, role, status, email_verified)

-- Content
destinations, hotels, attractions, transport_routes

-- User Activity  
trips, trip_days, trip_day_attractions, bookings, payments, reviews

-- System
notifications, audit_logs, password_reset_tokens
```

---

## API Endpoints Summary

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/auth/profile
- PUT /api/auth/profile
- PUT /api/auth/change-password
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### Admin (all /api/admin/)
- GET /hotels, POST /hotels, PUT /hotels/:id, DELETE /hotels/:id
- GET /destinations, POST /destinations, etc.
- GET /users, PUT /users/:id/suspend, etc.
- GET /analytics/overview, /revenue, /users, /bookings
- GET /bookings, PUT /bookings/:id/confirm, etc.

### User (public)
- GET /destinations, /destinations/:id
- GET /hotels, /hotels/:id
- GET /attractions, /attractions/:id
- POST /bookings, GET /bookings
- GET /trips, POST /trips

---

## Estimated Time to Complete

| Task | Hours |
|------|-------|
| Backend Controllers | 2-3 |
| Admin Routes | 1 |
| Admin Pages | 4-5 |
| User Pages | 3-4 |
| Auth Flow | 1-2 |
| Routing/Navigation | 1 |
| Testing | 2-3 |
| **Total** | **14-18** |

---

## Support Files

All files are in `/vercel/share/v0-project/`:
- `COMPLETE_PROJECT_ROADMAP.md` - Detailed architecture
- `backend/server.js` - Secure Express server
- `backend/controllers/secureAuthController.js` - Auth logic
- `backend/controllers/hotelController.js` - CRUD pattern
- `src/pages/admin/Hotels.tsx` - Admin page example
- `backend/middleware/secureAuth.js` - Auth middleware

---

## Next Actions

1. **Start with backend controllers** - Copy the hotelController pattern
2. **Create admin routes** - Wire up all controllers
3. **Build admin layout** - Sidebar navigation component
4. **Create admin pages** - One page per resource
5. **Setup auth flow** - Login/logout/token management
6. **Build user pages** - Content browsing and booking
7. **Test everything** - All CRUD operations
8. **Deploy to production** - With HTTPS

Good luck! You have a solid foundation now. 🚀
