# Ghana Trips Platform - Developer Guide

## Project Structure

```
backend/
├── controllers/          # Business logic for each feature
│   ├── authController.js
│   ├── adminUsersController.js
│   ├── adminTripsController.js
│   ├── adminDestinationsController.js
│   ├── adminHotelsController.js
│   ├── adminAttractionsController.js
│   ├── adminBookingsController.js
│   ├── adminTransportController.js
│   ├── adminReviewsController.js
│   ├── adminAnalyticsController.js
│   └── paystackController.js
├── routes/
│   ├── auth.js
│   ├── payments.js
│   ├── admin/
│   │   ├── index.js
│   │   ├── users.js
│   │   ├── trips.js
│   │   ├── destinations.js
│   │   ├── hotels.js
│   │   ├── transport.js
│   │   ├── attractions.js
│   │   ├── bookings.js
│   │   ├── reviews.js
│   │   └── analytics.js
├── middleware/          # Auth, rate limiting, validation
│   └── auth.js
├── utils/              # Helper functions
│   ├── email.js
│   └── sms.js
├── lib/
│   └── prisma.js       # Prisma client singleton
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Database migrations
├── server.js           # Express server setup
├── db.js              # Legacy database connection (deprecating)
└── package.json
```

## Adding a New Admin Feature

### 1. Create Controller
Create `controllers/admin[Feature]Controller.js`:

```javascript
const prisma = require('../lib/prisma');

exports.getAll[Features] = async (req, res) => {
  try {
    const { skip = 0, take = 10 } = req.query;
    
    const [[features], total] = await Promise.all([
      prisma.[feature].findMany({
        skip: parseInt(skip),
        take: parseInt(take),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.[feature].count(),
    ]);

    res.json({
      success: true,
      data: { [features], total },
    });
  } catch (error) {
    console.error('[adminFeatureController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

### 2. Create Routes
Create `routes/admin/[feature].js`:

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const controller = require('../../controllers/admin[Feature]Controller');

router.use(authenticateToken, requireAdmin);

router.get('/', controller.getAll[Features]);
router.post('/', controller.create[Feature]);
router.get('/:id', controller.get[Feature]);
router.put('/:id', controller.update[Feature]);
router.delete('/:id', controller.delete[Feature]);

module.exports = router;
```

### 3. Mount Routes
Update `routes/admin/index.js`:

```javascript
router.use('/[feature]', require('./[feature]'));
```

## Database Operations with Prisma

### Query Examples

```javascript
// Find all with filters
const users = await prisma.user.findMany({
  where: {
    status: 'ACTIVE',
    role: 'USER',
  },
  include: {
    trips: true,
    bookings: { take: 5 },
  },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10,
});

// Find one
const user = await prisma.user.findUnique({
  where: { id: userId },
});

// Create
const newUser = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
  },
});

// Update
const updated = await prisma.user.update({
  where: { id: userId },
  data: { firstName: 'Jane' },
});

// Delete
await prisma.user.delete({
  where: { id: userId },
});

// Count
const total = await prisma.user.count({
  where: { status: 'ACTIVE' },
});

// Aggregate
const stats = await prisma.payment.aggregate({
  where: { status: 'SUCCESS' },
  _sum: { amountGhs: true },
  _avg: { amountGhs: true },
});

// Group by
const byStatus = await prisma.booking.groupBy({
  by: ['status'],
  _count: { id: true },
  _sum: { totalPrice: true },
});
```

## Authentication Flow

### User Registration
1. User submits email, password, name
2. Password hashed with bcryptjs
3. User record created
4. Access and refresh tokens returned
5. Email sent (optional verification)

### User Login
1. Email + password submitted
2. User found and password verified
3. Account status checked (not suspended)
4. Access and refresh tokens generated
5. Audit log created

### Admin Operations
1. Must be authenticated (valid access token)
2. Must have admin role
3. Operation logged in audit_logs table
4. User notified of changes (if applicable)

## Payment Flow

### Checkout
1. User creates booking
2. Initiates payment via POST `/api/payments/initialize`
3. Returns Paystack authorization URL
4. User redirected to Paystack popup
5. Payment processed by Paystack

### Verification
1. User redirected back to app after payment
2. Verify payment via GET `/api/payments/verify/:reference`
3. Paystack API is called to confirm status
4. Booking status updated to CONFIRMED
5. Email confirmation sent

### Webhook
1. Paystack sends webhook to `/api/payments/webhook/paystack`
2. Signature validated with HMAC-SHA512
3. Payment status updated
4. Booking status updated if successful

## Error Handling

All controllers follow this pattern:

```javascript
try {
  // Validation
  if (!required_field) {
    return res.status(400).json({
      success: false,
      message: 'Field is required',
    });
  }

  // Check existence
  const item = await prisma.model.findUnique({...});
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Item not found',
    });
  }

  // Operation
  const result = await prisma.model.update({...});

  // Audit log (if needed)
  await prisma.auditLog.create({...});

  // Success response
  res.json({
    success: true,
    message: 'Operation successful',
    data: result,
  });
} catch (error) {
  console.error('[controllerName] Error:', error);
  res.status(500).json({
    success: false,
    message: error.message,
  });
}
```

## Testing Admin Endpoints

### Create Admin User (First Time Setup)
```bash
# The system creates admin@ghanatravel.com with password admin123
# during database init, or run:

psql -U postgres -d ghana_trips -c "
INSERT INTO users (id, email, password, first_name, last_name, role, status, created_at, updated_at)
VALUES (
  'admin-uuid-here',
  'admin@ghanatravel.com',
  '\$2a\$10\$...',  -- bcrypt hash of 'admin123'
  'System',
  'Admin',
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);"
```

### Get Admin Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ghanatravel.com",
    "password": "admin123"
  }'
```

### Use Token in Requests
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer eyJhbGci..."
```

## Common Tasks

### Add a New Destination
```bash
curl -X POST http://localhost:5000/api/admin/destinations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "Cape Coast",
    "slug": "cape-coast",
    "description": "Historical coastal town...",
    "region": "Central Region",
    "image": "https://...",
    "featured": true
  }'
```

### Approve a Trip
```bash
curl -X PUT http://localhost:5000/api/admin/trips/{tripId}/approve \
  -H "Authorization: Bearer <TOKEN>"
```

### Suspend User
```bash
curl -X PUT http://localhost:5000/api/admin/users/{userId}/suspend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "reason": "Suspicious activity detected"
  }'
```

### Get Analytics
```bash
curl -X GET http://localhost:5000/api/admin/analytics/overview \
  -H "Authorization: Bearer <TOKEN>"
```

## Debugging Tips

### Check Audit Logs
```javascript
// In controller
const logs = await prisma.auditLog.findMany({
  where: { resourceType: 'USER' },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
console.log(logs);
```

### View Database Directly
```bash
# Open Prisma Studio
npx prisma studio

# Or use psql
psql -U postgres -d ghana_trips
\dt  # List tables
SELECT * FROM users;
```

### Test Email Sending
```javascript
// In controller
const { sendEmail } = require('../utils/email');

await sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>This is a test</p>',
});
```

## Performance Considerations

1. **Always use pagination** - Never fetch all records without LIMIT
2. **Use include sparingly** - Only fetch related data you need
3. **Add indexes** - Already done in schema for common queries
4. **Use aggregation** - For counts, sums, averages instead of fetching all records
5. **Cache responses** - Consider Redis for frequently accessed data
6. **Rate limit sensitive endpoints** - Already implemented

## Security Checklist

- [ ] Input validation on all endpoints
- [ ] Authentication on protected routes
- [ ] Authorization checks (admin role)
- [ ] Audit logging for admin actions
- [ ] SQL injection prevention (Prisma handles this)
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] JWT secrets secured
- [ ] Sensitive data not logged
- [ ] Passwords hashed (bcryptjs)

## Next Steps for Team

1. Build React admin dashboard to consume these APIs
2. Implement notifications system with Bull/Redis
3. Add file upload for images (Vercel Blob or similar)
4. Create user-facing pages (destinations, hotels, attractions)
5. Implement real-time features if needed
6. Add comprehensive test suite
7. Set up CI/CD pipeline
8. Deploy to staging/production

## Support & Resources

- Prisma Docs: https://www.prisma.io/docs
- Express Docs: https://expressjs.com
- JWT Concepts: https://jwt.io/introduction
- Paystack API: https://paystack.com/docs/api
- Rate Limiting: https://www.npmjs.com/package/express-rate-limit
