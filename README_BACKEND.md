# Ghana Trips Platform - Backend Implementation

A comprehensive full-stack travel booking platform backend built with Express.js, PostgreSQL, and Prisma ORM.

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL database
- Redis (for caching and queues)
- Paystack account (for payments)
- Resend API key (for emails)
- Arkesel API key (for SMS)

### Installation

```bash
# Install dependencies
cd backend && npm install

# Configure environment
cp .env.example .env
# Edit .env with your actual values

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

Server will run on `http://localhost:5000`

## Project Structure

```
backend/
├── controllers/         # Business logic (14 files)
├── routes/             # API endpoints (11 files)
├── middleware/         # Auth, logging (enhanced)
├── queues/             # Bull queues for notifications
├── templates/          # Email templates
├── utils/              # Helpers (email, SMS, auth)
├── lib/                # Singleton clients (Prisma)
├── prisma/             # ORM schema and migrations
├── server.js           # Main Express app
├── db.js               # Database connection
├── package.json        # Dependencies
└── .env.example        # Environment template
```

## Core Features

### Authentication System
- JWT-based authentication with refresh tokens
- 15-minute access tokens + 7-day refresh tokens
- Password hashing with bcryptjs
- 6-digit password reset codes
- Rate limiting (login 5/15min, register 5/1hour)
- Audit logging for sensitive operations

### Admin Management
- **Users**: Suspend, activate, delete, statistics
- **Trips**: Approve/reject with feedback
- **Destinations**: CRUD with visibility control
- **Hotels**: Full management with room types
- **Transport**: Route scheduling
- **Attractions**: Approval queue for submissions
- **Bookings**: Management with refund handling
- **Reviews**: Moderation with featured status
- **Analytics**: Dashboard with KPIs

### Payment Processing
- Paystack integration with HMAC-SHA512 validation
- Currency conversion (GHS ↔ USD)
- Payment initialization and verification
- Refund management
- Webhook processing

### Notifications
- Bull queues for async processing
- Email notifications via Resend
- SMS via Arkesel
- In-app notifications with database storage
- User preference management
- Retry logic with exponential backoff

### User Content API
- Destination discovery with search/filter
- Hotel browsing with reviews
- Attraction search
- Transport route lookup
- Booking management
- Trip planning
- User submissions (attractions, reviews)
- 5-minute caching for performance

## API Documentation

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset with code
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update profile
- `PUT /auth/change-password` - Change password
- `POST /auth/refresh` - Refresh access token

### Admin Endpoints (50+ routes)
All under `/api/admin/` with role-based access control:
- `/users` - User management
- `/trips` - Trip approval workflow
- `/destinations` - Destination management
- `/hotels` - Hotel management with room types
- `/transport` - Transport route management
- `/attractions` - Attraction approval queue
- `/bookings` - Booking management
- `/reviews` - Review moderation
- `/analytics` - Dashboard analytics

### User Content Endpoints
All under `/api/content/`:
- `GET /destinations` - List destinations
- `GET /destinations/:slug` - Destination details
- `GET /hotels` - Search hotels
- `GET /hotels/:hotelId` - Hotel details
- `GET /attractions` - List attractions
- `GET /transport/routes` - Find routes
- `GET /transport/locations` - Location autocomplete
- `POST /attractions/submit` - Submit attraction
- `POST /reviews/submit` - Submit review

### Payment Endpoints
- `POST /payments/initialize` - Start payment
- `GET /payments/verify/:reference` - Verify payment
- `POST /payments/webhook/paystack` - Webhook handler

### Notification Endpoints
- `GET /notifications` - List notifications
- `PUT /notifications/:id/read` - Mark as read
- `GET /notifications/preferences/get` - Get preferences
- `PUT /notifications/preferences/update` - Update preferences

## Database Models (18 total)

- **User** - User accounts with roles
- **Trip** - Travel packages with itineraries
- **Destination** - Locations with details
- **Hotel** - Accommodation with room types
- **RoomType** - Hotel room variants
- **Attraction** - Places of interest
- **TransportRoute** - Travel routes
- **Booking** - Reservations
- **Payment** - Payment records
- **Review** - User ratings/comments
- **Notification** - Multi-channel notifications
- **NotificationPreference** - User preferences
- **AuditLog** - Operation tracking
- **PasswordResetToken** - Reset codes
- Plus supporting models...

## Environment Variables

Required configuration:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m

# Paystack
PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxx

# Email (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@ghanatravel.co

# SMS (Arkesel)
ARKESEL_API_KEY=xxx
ARKESEL_SENDER_ID=GhanaTravelCo

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Key Technologies

- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT with refresh tokens
- **Payment**: Paystack API
- **Email**: Resend
- **SMS**: Arkesel
- **Queues**: Bull + Redis
- **Caching**: Redis
- **Security**: bcryptjs, rate-limiter-flexible

## Security Features

- Rate limiting on sensitive endpoints
- JWT token expiry and refresh rotation
- Password hashing with bcryptjs
- HMAC-SHA512 webhook validation
- Audit logging for all admin operations
- Account suspension capability
- Role-based access control
- Input validation and sanitization

## Performance Optimizations

- 24+ database indexes
- Redis caching (5-minute TTL)
- Pagination for large datasets
- Connection pooling
- Efficient Prisma queries
- Async notification processing

## Testing the API

### Create User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Destinations
```bash
curl http://localhost:5000/api/content/destinations
```

### Admin Dashboard (with token)
```bash
curl http://localhost:5000/api/admin/analytics/overview \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Common Tasks

### Run Migrations
```bash
npx prisma migrate deploy
```

### View Database Schema
```bash
npx prisma studio
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Reset Database (development)
```bash
npx prisma migrate reset
```

## Troubleshooting

### Database Connection Error
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check credentials

### Paystack Webhook Not Working
- Verify PAYSTACK_WEBHOOK_SECRET is set
- Check webhook URL in Paystack dashboard
- Ensure backend is accessible from Paystack

### Emails Not Sending
- Verify RESEND_API_KEY is valid
- Check sender domain is verified in Resend
- Review email templates in templates/

### Redis Connection Error
- Ensure Redis is running on configured port
- Check REDIS_HOST and REDIS_PORT

## Documentation

- **IMPLEMENTATION_STATUS.md** - Detailed implementation overview
- **DEVELOPER_GUIDE.md** - Development patterns and conventions
- **FRONTEND_INTEGRATION.md** - API integration guide for frontend
- **PROJECT_SUMMARY.md** - Executive summary and architecture

## Production Deployment

Before deploying to production:

1. Set NODE_ENV=production
2. Use strong JWT_SECRET and API keys
3. Enable HTTPS/SSL
4. Configure production database
5. Set up email/SMS providers
6. Configure payment webhook URLs
7. Enable database backups
8. Set up monitoring and logging
9. Configure rate limiting appropriately
10. Use environment-specific configuration

## License

All code in this project is proprietary and confidential to Ghana Trips Platform.

## Support

For technical questions or issues, refer to:
- DEVELOPER_GUIDE.md for architecture details
- FRONTEND_INTEGRATION.md for API usage
- Individual controller files for endpoint details
