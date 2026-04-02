# Ghana Trips Platform - Quick Reference

## Start Development

```bash
# Backend
cd backend
npm install
npm start  # runs on localhost:5000

# Frontend (new terminal)
cd ..
npm install
npm run dev  # runs on localhost:5173
```

## Key Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Reset password
- `PUT /api/auth/profile` - Update profile

### User Features
- `POST /api/trips` - Create trip
- `GET /api/trips` - Get user's trips
- `POST /api/trips/{id}/submit-approval` - Submit for approval
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create booking
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/{id}/read` - Mark as read

### Admin
- `GET /api/admin/trips/pending` - Get pending trips
- `POST /api/admin/trips/{id}/approve` - Approve trip
- `POST /api/admin/trips/{id}/reject` - Reject trip
- `GET /api/admin/users` - List users
- `POST /api/admin/users/{id}/reset-password` - Reset password
- `POST /api/admin/users/{id}/suspend` - Suspend user
- `GET /api/admin/analytics` - Dashboard stats

## Default Admin Account

```
Email: admin@ghanatrips.com
Password: Set in database or env
```

## Database Tables

```
users, trips, bookings, payments
destinations, hotels, attractions
reviews, notifications, audit_logs
transport_routes, password_reset_tokens
```

## Frontend Routes

```
/login - User login
/register - User registration
/dashboard - User dashboard
/trips - Trip planner
/destinations - Browse destinations
/bookings - Manage bookings
/notifications - View alerts
/admin - Admin dashboard
```

## Security Checklist

- [x] SQL injection protection (parameterized queries)
- [x] CSRF token validation
- [x] XSS sanitization
- [x] Rate limiting
- [x] Password hashing (bcrypt)
- [x] JWT tokens
- [x] Role-based access
- [x] Audit logging
- [x] Account lockout
- [x] CORS validation

## Testing Account

```
Email: test@example.com
Password: Test123!@#
```

Create via register endpoint or database insert.

## Common Errors & Fixes

**"Token expired"**
- Use refresh token endpoint
- Check JWT_EXPIRY in .env

**"Unauthorized"**
- Ensure Authorization header: `Bearer {token}`
- Check token in localStorage

**"Database connection error"**
- Verify DATABASE_URL in .env
- Check Neon dashboard for active connection

**"CORS error"**
- Verify CORS_ORIGIN in backend .env
- Check frontend VITE_API_URL

## Performance Tips

- Use pagination for lists (limit: 20)
- Cache destinations and hotels (5-min TTL)
- Compress images for avatars
- Use indexes on frequently queried fields

## Next Immediate Steps

1. Set environment variables (.env file)
2. Run `npm install` in both directories
3. Start backend: `npm start`
4. Start frontend: `npm run dev`
5. Register test account
6. Create test trip
7. Login as admin
8. Approve trip
9. Check notification in user account
10. Celebrate! 🎉
