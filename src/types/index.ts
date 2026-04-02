export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  first_name?: string; // DB alias
  last_name?: string;  // DB alias
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  created_at?: string; // DB alias
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  location: string;
  destinationId: string;
  pricePerNight: number;
  currency: 'GHS' | 'USD';
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  roomTypes: RoomType[];
  featured: boolean;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  available: boolean;
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  image: string;
  attractions: number;
  hotels: number;
  region: string;
  featured: boolean;
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  location: string;
  destinationId: string;
  image: string;
  category: string;
  entryFee: number;
  currency: 'GHS' | 'USD';
  rating: number;
  reviews?: number;
  openingHours: string;
  featured?: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: 'GHS' | 'USD';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt: string;
}

export interface Trip {
  id: string;
  userId: string;
  user_id?: string; // DB alias
  name: string;
  title?: string; // High-level naming
  startDate: string;
  start_date?: string; // DB alias
  endDate: string;
  end_date?: string; // DB alias
  destinations: string[];
  destination?: string; // DB singular alias
  hotels: string[];
  attractions: string[];
  transport?: string;
  transport_details?: string[]; // Manual transport registry
  sideAttractions?: string;
  side_attractions?: string; // DB alias
  activities?: string | string[]; // Can be string or array for manual entry
  budget: number;
  total_budget?: number; // Financial target
  currency: 'GHS' | 'USD';
  status: 'planning' | 'upcoming' | 'ongoing' | 'completed' | 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'confirmed';
  notes?: string;
  itinerary?: string[]; // Manual phase-based registry
  created_at?: string; // DB alias
}


export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'trip' | 'promo' | 'system';
  read: boolean;
  createdAt: string;
}

export interface TransportOption {
  id: string;
  type: 'bus' | 'shuttle' | 'private' | 'flight';
  from: string;
  to: string;
  price: number;
  currency: 'GHS' | 'USD';
  duration: string;
  provider: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecentBookingData {
  id: string;
  hotel_name: string;
  check_in: string;
  first_name?: string;
  last_name?: string;
  status: string;
  total_price: number | string;
}

export interface TopDestinationData {
  name: string;
  booking_count: number | string;
  revenue: number | string;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: string | number;
  bookings: string | number;
}

export interface AnalyticsData {
  totalUsers: number;
  totalHotels: number;
  totalBookings: number;
  totalDestinations: number;
  totalAttractions: number;
  totalRevenue: number;
  topDestinations: TopDestinationData[];
  recentBookings: RecentBookingData[];
  monthlyRevenue: MonthlyRevenueData[];
}
