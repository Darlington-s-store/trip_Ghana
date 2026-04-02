import type { Destination, Hotel, Attraction, Booking, Trip, Notification } from '@/types';

export const destinations: Destination[] = [
  {
    id: '1', name: 'Accra', slug: 'accra',
    description: 'Ghana\'s vibrant capital blends modern skyscrapers with colonial-era architecture, bustling markets, and a thriving arts scene along the Atlantic coast.',
    shortDescription: 'Vibrant capital with beaches, markets & nightlife',
    image: '/placeholder.svg', attractions: 24, hotels: 45, region: 'Greater Accra', featured: true,
  },
  {
    id: '2', name: 'Cape Coast', slug: 'cape-coast',
    description: 'A historic coastal city famous for its UNESCO World Heritage castle, canopy walkway through the rainforest, and beautiful beaches.',
    shortDescription: 'Historic castles & rainforest canopy walks',
    image: '/placeholder.svg', attractions: 18, hotels: 22, region: 'Central Region', featured: true,
  },
  {
    id: '3', name: 'Kumasi', slug: 'kumasi',
    description: 'The cultural heart of the Ashanti Kingdom, known for the vast Kejetia Market, royal palaces, and rich traditional craftsmanship.',
    shortDescription: 'Heart of the Ashanti Kingdom',
    image: '/placeholder.svg', attractions: 20, hotels: 30, region: 'Ashanti Region', featured: true,
  },
  {
    id: '4', name: 'Tamale', slug: 'tamale',
    description: 'Gateway to northern Ghana, offering unique savanna landscapes, Mole National Park safaris, and warm Dagomba hospitality.',
    shortDescription: 'Gateway to safaris & northern culture',
    image: '/placeholder.svg', attractions: 12, hotels: 15, region: 'Northern Region', featured: false,
  },
  {
    id: '5', name: 'Ada Foah', slug: 'ada-foah',
    description: 'Where the Volta River meets the Atlantic Ocean, offering water sports, birdwatching, and the spectacular Asafotufiami festival.',
    shortDescription: 'River meets ocean — water sports paradise',
    image: '/placeholder.svg', attractions: 8, hotels: 10, region: 'Greater Accra', featured: true,
  },
  {
    id: '6', name: 'Volta Region', slug: 'volta-region',
    description: 'Rolling green hills, stunning waterfalls including Wli Falls, and the picturesque town of Hohoe nestled in lush mountains.',
    shortDescription: 'Waterfalls, mountains & lush greenery',
    image: '/placeholder.svg', attractions: 15, hotels: 12, region: 'Volta Region', featured: true,
  },
];

export const hotels: Hotel[] = [
  {
    id: '1', name: 'Kempinski Hotel Gold Coast', description: 'Five-star luxury on Accra\'s ministerial enclave with ocean views, world-class dining, and a stunning infinity pool.',
    location: 'Accra', destinationId: '1', pricePerNight: 450, currency: 'USD', rating: 4.8, reviewCount: 342,
    images: ['/placeholder.svg'], amenities: ['Pool', 'Spa', 'Restaurant', 'Gym', 'WiFi', 'Bar', 'Room Service'],
    roomTypes: [
      { id: 'r1', name: 'Deluxe Room', description: 'Spacious room with city views', pricePerNight: 450, maxGuests: 2, available: true },
      { id: 'r2', name: 'Executive Suite', description: 'Luxury suite with lounge', pricePerNight: 750, maxGuests: 3, available: true },
    ],
    featured: true,
  },
  {
    id: '2', name: 'Labadi Beach Hotel', description: 'Iconic beachfront resort with tropical gardens, multiple restaurants, and direct beach access.',
    location: 'Accra', destinationId: '1', pricePerNight: 280, currency: 'USD', rating: 4.5, reviewCount: 518,
    images: ['/placeholder.svg'], amenities: ['Beach Access', 'Pool', 'Restaurant', 'WiFi', 'Tennis Court'],
    roomTypes: [
      { id: 'r3', name: 'Standard Room', description: 'Comfortable room with garden view', pricePerNight: 280, maxGuests: 2, available: true },
    ],
    featured: true,
  },
  {
    id: '3', name: 'Ridge Royal Hotel', description: 'Boutique hotel in Kumasi with rooftop dining, modern rooms, and cultural tour arrangements.',
    location: 'Kumasi', destinationId: '3', pricePerNight: 120, currency: 'USD', rating: 4.3, reviewCount: 189,
    images: ['/placeholder.svg'], amenities: ['Restaurant', 'WiFi', 'Parking', 'Conference Room'],
    roomTypes: [
      { id: 'r4', name: 'Standard Room', description: 'Cozy room with modern amenities', pricePerNight: 120, maxGuests: 2, available: true },
    ],
    featured: false,
  },
  {
    id: '4', name: 'Coconut Grove Beach Resort', description: 'Charming beachfront resort in Elmina with colonial-era charm and fresh seafood dining.',
    location: 'Cape Coast', destinationId: '2', pricePerNight: 150, currency: 'USD', rating: 4.4, reviewCount: 267,
    images: ['/placeholder.svg'], amenities: ['Beach', 'Pool', 'Restaurant', 'WiFi', 'Garden'],
    roomTypes: [
      { id: 'r5', name: 'Garden Room', description: 'Room overlooking tropical gardens', pricePerNight: 150, maxGuests: 2, available: true },
    ],
    featured: true,
  },
];

export const attractions: Attraction[] = [
  { id: '1', name: 'Cape Coast Castle', description: 'UNESCO World Heritage slave castle with museum and "Door of No Return" — a powerful historical landmark.', location: 'Cape Coast', destinationId: '2', image: '/placeholder.svg', category: 'Historical', entryFee: 40, currency: 'GHS', rating: 4.7, openingHours: '9am - 5pm' },
  { id: '2', name: 'Kakum National Park', description: 'Rainforest reserve famous for its 350m canopy walkway suspended 30m above the forest floor.', location: 'Cape Coast', destinationId: '2', image: '/placeholder.svg', category: 'Nature', entryFee: 60, currency: 'GHS', rating: 4.8, openingHours: '8am - 4pm' },
  { id: '3', name: 'Kwame Nkrumah Memorial', description: 'Park and mausoleum dedicated to Ghana\'s first president, featuring his tomb and a museum of national history.', location: 'Accra', destinationId: '1', image: '/placeholder.svg', category: 'Historical', entryFee: 20, currency: 'GHS', rating: 4.4, openingHours: '9am - 5pm' },
  { id: '4', name: 'Mole National Park', description: 'Ghana\'s largest wildlife refuge with elephants, antelopes, baboons, and guided walking safaris.', location: 'Tamale', destinationId: '4', image: '/placeholder.svg', category: 'Nature', entryFee: 50, currency: 'GHS', rating: 4.9, openingHours: '6am - 6pm' },
  { id: '5', name: 'Manhyia Palace Museum', description: 'The seat of the Ashanti king showcasing centuries of Ashanti royal heritage and artefacts.', location: 'Kumasi', destinationId: '3', image: '/placeholder.svg', category: 'Cultural', entryFee: 30, currency: 'GHS', rating: 4.5, openingHours: '9am - 4:30pm' },
  { id: '6', name: 'Wli Waterfalls', description: 'The highest waterfall in West Africa, set in lush forest teeming with fruit bats and butterflies.', location: 'Hohoe', destinationId: '6', image: '/placeholder.svg', category: 'Nature', entryFee: 25, currency: 'GHS', rating: 4.6, openingHours: '7am - 4pm' },
];

export const sampleBookings: Booking[] = [
  { id: 'b1', userId: '1', hotelId: '1', hotelName: 'Kempinski Hotel Gold Coast', roomType: 'Deluxe Room', checkIn: '2026-04-15', checkOut: '2026-04-18', guests: 2, totalPrice: 1350, currency: 'USD', status: 'confirmed', paymentStatus: 'paid', createdAt: '2026-03-20' },
  { id: 'b2', userId: '1', hotelId: '4', hotelName: 'Coconut Grove Beach Resort', roomType: 'Garden Room', checkIn: '2026-05-01', checkOut: '2026-05-04', guests: 2, totalPrice: 450, currency: 'USD', status: 'pending', paymentStatus: 'unpaid', createdAt: '2026-03-28' },
];

export const sampleTrips: Trip[] = [
  { id: 't1', userId: '1', name: 'Coastal Ghana Explorer', startDate: '2026-04-15', endDate: '2026-04-22', destinations: ['Accra', 'Cape Coast', 'Ada Foah'], hotels: ['1', '4'], attractions: ['1', '2', '3'], budget: 3000, currency: 'USD', status: 'upcoming', notes: 'Visit castles and enjoy beach time' },
  { id: 't2', userId: '1', name: 'Northern Safari Adventure', startDate: '2026-06-10', endDate: '2026-06-15', destinations: ['Tamale'], hotels: ['3'], attractions: ['4'], budget: 1500, currency: 'USD', status: 'planning' },
];

export const sampleNotifications: Notification[] = [
  { id: 'n1', userId: '1', title: 'Booking Confirmed', message: 'Your booking at Kempinski Hotel Gold Coast has been confirmed.', type: 'booking', read: false, createdAt: '2026-03-30T10:00:00Z' },
  { id: 'n2', userId: '1', title: 'Trip Reminder', message: 'Your Coastal Ghana Explorer trip starts in 15 days!', type: 'trip', read: false, createdAt: '2026-03-29T08:00:00Z' },
  { id: 'n3', userId: '1', title: 'Special Offer', message: 'Get 20% off Cape Coast hotels this Easter!', type: 'promo', read: true, createdAt: '2026-03-25T12:00:00Z' },
];

export const adminStats = {
  totalUsers: 2847,
  totalBookings: 1234,
  totalRevenue: 456789,
  activeTrips: 89,
  monthlyGrowth: 12.5,
  occupancyRate: 78,
};
