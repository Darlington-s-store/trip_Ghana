-- GhanaTravel Database Schema for Neon PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar TEXT,
  role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Password Reset Tokens (Token-code flow)
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Destinations
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  image TEXT,
  region VARCHAR(100),
  featured BOOLEAN DEFAULT FALSE,
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hotels
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  location VARCHAR(255),
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  destinations TEXT[] DEFAULT '{}',
  transport TEXT,
  side_attractions TEXT,
  activities TEXT,
  budget DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'GHS',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'completed')),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trip Days (Structured Itinerary)
CREATE TABLE trip_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attractions
CREATE TABLE attractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  location VARCHAR(255),
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  image TEXT,
  category VARCHAR(50),
  entry_fee DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'GHS',
  rating DECIMAL(2,1) DEFAULT 0,
  opening_hours VARCHAR(100),
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trip Day Attractions (Linking structured day to attractions)
CREATE TABLE trip_day_attractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_day_id UUID REFERENCES trip_days(id) ON DELETE CASCADE,
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  visit_time TIME,
  notes TEXT
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('hotel', 'attraction', 'transport')),
  target_id UUID NOT NULL, -- Generic ID pointing to hotel, attraction, etc.
  check_in DATE,
  check_out DATE,
  guests INT DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  payment_ref VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  paystack_ref VARCHAR(255) UNIQUE NOT NULL,
  amount_ghs DECIMAL(10,2) NOT NULL,
  amount_usd DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','success','failed','reversed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transport Routes
CREATE TABLE transport_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator VARCHAR(100) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('bus', 'shuttle', 'private', 'flight')),
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  price_ghs DECIMAL(10,2) NOT NULL,
  schedule TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) CHECK (entity_type IN ('hotel', 'attraction', 'destination', 'transport')),
  entity_id UUID NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(20) CHECK (type IN ('booking','trip','promo','system')),
  channel VARCHAR(10) DEFAULT 'in-app' CHECK (channel IN ('in-app', 'email', 'sms', 'both')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_hotels_destination ON hotels(destination_id);
CREATE INDEX idx_attractions_destination ON attractions(destination_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trip_days_trip ON trip_days(trip_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_reviews_entity ON reviews(entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
