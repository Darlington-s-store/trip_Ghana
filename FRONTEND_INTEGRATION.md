# Frontend Integration Guide

This guide explains how to integrate the Ghana Trips Platform backend API with your React frontend.

## API Base URL

```javascript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```javascript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json'
};
```

## Key Endpoints

### Authentication Endpoints (`/auth`)

#### Register
```javascript
POST /auth/register
{
  email: string,
  password: string,
  firstName: string,
  lastName: string
}
```

#### Login
```javascript
POST /auth/login
{
  email: string,
  password: string
}
Response includes: accessToken, refreshToken, user
```

#### Get Profile
```javascript
GET /auth/profile
Headers: Authorization Bearer token
```

#### Update Profile
```javascript
PUT /auth/profile
Headers: Authorization Bearer token
{
  firstName?: string,
  lastName?: string,
  phone?: string,
  avatar?: string
}
```

#### Refresh Token
```javascript
POST /auth/refresh
{
  refreshToken: string
}
```

#### Logout
```javascript
POST /auth/logout
Headers: Authorization Bearer token
```

### Content Endpoints (`/content`)

#### Get Destinations
```javascript
GET /content/destinations?page=1&limit=12&search=Accra&region=Greater%20Accra
Response:
{
  success: true,
  data: [
    {
      id: string,
      name: string,
      slug: string,
      shortDescription: string,
      image: string,
      region: string,
      bestTimeToVisit: string,
      _count: { hotels: number, attractions: number }
    }
  ],
  pagination: { page, limit, total, pages }
}
```

#### Get Destination Details
```javascript
GET /content/destinations/:slug
Response:
{
  success: true,
  data: {
    id: string,
    name: string,
    slug: string,
    description: string,
    image: string,
    region: string,
    bestTimeToVisit: string,
    hotels: [
      { id, name, description, image, rating, priceGhs }
    ],
    attractions: [
      { id, name, description, image, rating }
    ]
  }
}
```

#### Get Hotels
```javascript
GET /content/hotels?destinationId=xxx&priceMin=50&priceMax=500&search=Hilton&page=1&limit=12
Response:
{
  success: true,
  data: [
    {
      id: string,
      name: string,
      description: string,
      image: string,
      rating: number,
      priceGhs: decimal,
      roomTypes: [
        { id, type, priceGhs }
      ],
      _count: { bookings, reviews }
    }
  ],
  pagination: { page, limit, total, pages }
}
```

#### Get Hotel Details
```javascript
GET /content/hotels/:hotelId
Response:
{
  success: true,
  data: {
    id: string,
    name: string,
    description: string,
    image: string,
    rating: number,
    roomTypes: [
      { id, type, description, priceGhs, capacity }
    ],
    reviews: [
      {
        id: string,
        rating: number,
        comment: string,
        createdAt: datetime,
        user: { firstName, lastName, avatar }
      }
    ],
    destination: { id, name, slug }
  }
}
```

#### Get Attractions
```javascript
GET /content/attractions?destinationId=xxx&page=1&limit=12&search=waterfall
Response:
{
  success: true,
  data: [
    {
      id: string,
      name: string,
      description: string,
      image: string,
      rating: number,
      entryFeeGhs: decimal,
      openingHours: string
    }
  ],
  pagination: { page, limit, total, pages }
}
```

#### Get Transport Routes
```javascript
GET /content/transport/routes?origin=Accra&destination=Kumasi&type=BUS
Response:
{
  success: true,
  data: [
    {
      id: string,
      operator: string,
      type: 'BUS' | 'SHUTTLE' | 'PRIVATE' | 'FLIGHT',
      origin: string,
      destination: string,
      priceGhs: decimal,
      schedule: string,
      rating: number
    }
  ]
}
```

#### Get Transport Locations
```javascript
GET /content/transport/locations
Response:
{
  success: true,
  data: {
    origins: [string],
    destinations: [string]
  }
}
```

### User Content Endpoints (Protected)

#### Get User Trips
```javascript
GET /content/my-trips?page=1&limit=10&status=APPROVED
Headers: Authorization Bearer token
Response:
{
  success: true,
  data: [
    {
      id: string,
      title: string,
      destination: { id, name, image },
      startDate: date,
      endDate: date,
      status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED',
      _count: { days: number, bookings: number }
    }
  ],
  pagination: { page, limit, total, pages }
}
```

#### Get User Bookings
```javascript
GET /content/my-bookings?page=1&limit=10&type=HOTEL&status=CONFIRMED
Headers: Authorization Bearer token
Response:
{
  success: true,
  data: [
    {
      id: string,
      reference: string,
      type: 'HOTEL' | 'ATTRACTION' | 'TRANSPORT',
      status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
      paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED',
      checkIn: date,
      checkOut: date,
      totalPrice: decimal,
      currency: 'GHS' | 'USD',
      createdAt: datetime,
      hotel?: { id, name, image },
      attraction?: { id, name, image },
      transport?: { id, operator }
    }
  ],
  pagination: { page, limit, total, pages }
}
```

#### Submit Attraction
```javascript
POST /content/attractions/submit
Headers: Authorization Bearer token
{
  name: string,
  description: string,
  destinationId: string,
  image: string,
  entryFeeGhs: decimal,
  openingHours: string
}
Response:
{
  success: true,
  message: 'Attraction submitted for review',
  data: { attraction object }
}
```

#### Submit Review
```javascript
POST /content/reviews/submit
Headers: Authorization Bearer token
{
  entityType: 'HOTEL' | 'ATTRACTION' | 'DESTINATION' | 'TRANSPORT',
  entityId: string,
  rating: 1-5,
  comment: string
}
Response:
{
  success: true,
  message: 'Review submitted for moderation',
  data: { review object }
}
```

### Notifications Endpoints (Protected)

#### Get Notifications
```javascript
GET /notifications?page=1&limit=20&unreadOnly=false
Headers: Authorization Bearer token
```

#### Mark as Read
```javascript
PUT /notifications/:notificationId/read
Headers: Authorization Bearer token
```

#### Mark All as Read
```javascript
PUT /notifications/read-all
Headers: Authorization Bearer token
```

#### Delete Notification
```javascript
DELETE /notifications/:notificationId
Headers: Authorization Bearer token
```

#### Get Notification Preferences
```javascript
GET /notifications/preferences/get
Headers: Authorization Bearer token
```

#### Update Notification Preferences
```javascript
PUT /notifications/preferences/update
Headers: Authorization Bearer token
{
  emailBookingConfirmation: boolean,
  emailPaymentAlert: boolean,
  emailMarketingUpdates: boolean,
  emailTripRecommendations: boolean,
  smsBookingConfirmation: boolean,
  smsPaymentAlert: boolean,
  smsPromotions: boolean,
  pushNotifications: boolean
}
```

### Bookings Endpoints (Protected)

#### Initialize Payment
```javascript
POST /payments/initialize
Headers: Authorization Bearer token
{
  hotelId: string,
  roomTypeId: string,
  checkIn: date,
  checkOut: date,
  guests: number,
  totalPrice: decimal,
  currency: 'GHS' | 'USD'
}
Response:
{
  success: true,
  data: {
    booking: { booking object },
    paystack: {
      reference: string,
      email: string,
      amount: number (in pesewas/kobo),
      currency: string,
      publicKey: string
    }
  }
}
```

#### Verify Payment
```javascript
GET /payments/verify/:reference
Headers: Authorization Bearer token
Response:
{
  success: true,
  data: { payment object with status }
}
```

## Frontend Setup Example

```javascript
// api.ts or api.js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
  // Auth
  auth: {
    register: (data) => fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

    login: (data) => fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

    getProfile: () => fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
    }).then(r => r.json()),

    logout: () => fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
    }).then(r => r.json()),
  },

  // Content
  content: {
    getDestinations: (params) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${API_BASE}/content/destinations?${query}`).then(r => r.json());
    },

    getDestinationDetail: (slug) =>
      fetch(`${API_BASE}/content/destinations/${slug}`).then(r => r.json()),

    getHotels: (params) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${API_BASE}/content/hotels?${query}`).then(r => r.json());
    },

    getHotelDetail: (hotelId) =>
      fetch(`${API_BASE}/content/hotels/${hotelId}`).then(r => r.json()),

    getAttractions: (params) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${API_BASE}/content/attractions?${query}`).then(r => r.json());
    },

    getTransportRoutes: (params) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${API_BASE}/content/transport/routes?${query}`).then(r => r.json());
    },

    getTransportLocations: () =>
      fetch(`${API_BASE}/content/transport/locations`).then(r => r.json()),

    submitAttraction: (data) => fetch(`${API_BASE}/content/attractions/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),

    submitReview: (data) => fetch(`${API_BASE}/content/reviews/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  },

  // Payments
  payments: {
    initialize: (data) => fetch(`${API_BASE}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),

    verify: (reference) =>
      fetch(`${API_BASE}/payments/verify/${reference}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      }).then(r => r.json()),
  },

  // Notifications
  notifications: {
    getAll: (params) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${API_BASE}/notifications?${query}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      }).then(r => r.json());
    },

    markAsRead: (notificationId) =>
      fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      }).then(r => r.json()),

    getPreferences: () =>
      fetch(`${API_BASE}/notifications/preferences/get`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      }).then(r => r.json()),

    updatePreferences: (data) =>
      fetch(`${API_BASE}/notifications/preferences/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).then(r => r.json()),
  },
};
```

## Environment Variables (.env)

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_live_xxx
```

## Error Handling

All responses follow a standard format:

```javascript
{
  success: boolean,
  message?: string,
  data?: any,
  error?: { field: string, message: string }[]
}
```

## Caching Strategy

- Destinations: Cached for 5 minutes
- Hotel details: Cached for 5 minutes
- Transport routes: Not cached (real-time)
- User content: Not cached (personal data)

## Rate Limiting

- Login: 5 attempts per 15 minutes
- Register: 5 attempts per 1 hour
- General API: 100 requests per 15 minutes

## Token Refresh Flow

1. Access token expires after 15 minutes
2. Use refresh token to get new access token
3. Store new tokens in localStorage
4. Retry failed requests with new token

```javascript
// Implement in API interceptor
if (response.status === 401) {
  const newToken = await api.auth.refreshToken(refreshToken);
  localStorage.setItem('accessToken', newToken);
  return retryRequest();
}
```
