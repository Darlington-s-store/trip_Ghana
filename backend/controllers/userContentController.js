const prisma = require('../lib/prisma');
const redis = require('redis');

// Redis client for caching
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

const CACHE_TTL = 300; // 5 minutes

const userContentController = {
  // Get all destinations with filters and search
  getDestinations: async (req, res) => {
    try {
      const { page = 1, limit = 12, search, region } = req.query;
      const skip = (page - 1) * limit;

      // Try to get from cache
      const cacheKey = `destinations:${page}:${limit}:${search || ''}:${region || ''}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const where = { isVisible: true };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (region) where.region = region;

      const [destinations, total] = await Promise.all([
        prisma.destination.findMany({
          where,
          select: {
            id: true,
            name: true,
            slug: true,
            shortDescription: true,
            image: true,
            region: true,
            bestTimeToVisit: true,
            _count: { select: { hotels: true, attractions: true } },
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.destination.count({ where }),
      ]);

      const result = {
        success: true,
        data: destinations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };

      // Cache the result
      await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single destination with details
  getDestinationDetail: async (req, res) => {
    try {
      const { slug } = req.params;

      // Try cache
      const cached = await redisClient.get(`destination:${slug}`);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const destination = await prisma.destination.findUnique({
        where: { slug },
        include: {
          hotels: {
            where: { isVisible: true },
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
              rating: true,
              priceGhs: true,
            },
            take: 6,
          },
          attractions: {
            where: { status: 'APPROVED' },
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
              rating: true,
            },
            take: 8,
          },
        },
      });

      if (!destination || !destination.isVisible) {
        return res.status(404).json({ success: false, message: 'Destination not found' });
      }

      const result = { success: true, data: destination };
      await redisClient.setex(`destination:${slug}`, CACHE_TTL, JSON.stringify(result));
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get available hotels with search and filters
  getHotels: async (req, res) => {
    try {
      const { destinationId, priceMin = 0, priceMax = 10000, search, page = 1, limit = 12 } = req.query;
      const skip = (page - 1) * limit;

      const where = {
        isVisible: true,
        priceGhs: {
          gte: parseInt(priceMin),
          lte: parseInt(priceMax),
        },
      };

      if (destinationId) where.destinationId = destinationId;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [hotels, total] = await Promise.all([
        prisma.hotel.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            rating: true,
            priceGhs: true,
            roomTypes: { select: { id: true, type: true, priceGhs: true } },
            _count: { select: { bookings: true, reviews: true } },
          },
          skip,
          take: parseInt(limit),
          orderBy: { rating: 'desc' },
        }),
        prisma.hotel.count({ where }),
      ]);

      res.json({
        success: true,
        data: hotels,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get hotel details with reviews and room types
  getHotelDetail: async (req, res) => {
    try {
      const { hotelId } = req.params;

      const hotel = await prisma.hotel.findUnique({
        where: { id: hotelId },
        include: {
          roomTypes: {
            select: { id: true, type: true, description: true, priceGhs: true, capacity: true },
          },
          reviews: {
            where: { status: 'APPROVED' },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: { select: { firstName: true, lastName: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          destination: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!hotel || !hotel.isVisible) {
        return res.status(404).json({ success: false, message: 'Hotel not found' });
      }

      res.json({ success: true, data: hotel });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get attractions for destination
  getAttractions: async (req, res) => {
    try {
      const { destinationId, page = 1, limit = 12, search } = req.query;
      const skip = (page - 1) * limit;

      const where = {
        destinationId,
        status: 'APPROVED',
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [attractions, total] = await Promise.all([
        prisma.attraction.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            rating: true,
            entryFeeGhs: true,
            openingHours: true,
          },
          skip,
          take: parseInt(limit),
          orderBy: { rating: 'desc' },
        }),
        prisma.attraction.count({ where }),
      ]);

      res.json({
        success: true,
        data: attractions,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get transport routes
  getTransportRoutes: async (req, res) => {
    try {
      const { origin, destination, type } = req.query;

      const where = {};
      if (origin) where.origin = { contains: origin, mode: 'insensitive' };
      if (destination) where.destination = { contains: destination, mode: 'insensitive' };
      if (type) where.type = type;

      const routes = await prisma.transportRoute.findMany({
        where,
        select: {
          id: true,
          operator: true,
          type: true,
          origin: true,
          destination: true,
          priceGhs: true,
          schedule: true,
          rating: true,
        },
        orderBy: { rating: 'desc' },
      });

      res.json({ success: true, data: routes });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get unique locations for search dropdowns
  getTransportLocations: async (req, res) => {
    try {
      const origins = await prisma.transportRoute.findMany({
        select: { origin: true },
        distinct: ['origin'],
      });

      const destinations = await prisma.transportRoute.findMany({
        select: { destination: true },
        distinct: ['destination'],
      });

      res.json({
        success: true,
        data: {
          origins: origins.map(r => r.origin),
          destinations: destinations.map(r => r.destination),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get user trips
  getUserTrips: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10, status } = req.query;
      const skip = (page - 1) * limit;

      const where = { userId };
      if (status) where.status = status;

      const [trips, total] = await Promise.all([
        prisma.trip.findMany({
          where,
          select: {
            id: true,
            title: true,
            destination: { select: { id: true, name: true, image: true } },
            startDate: true,
            endDate: true,
            status: true,
            _count: { select: { days: true, bookings: true } },
          },
          skip,
          take: parseInt(limit),
          orderBy: { startDate: 'desc' },
        }),
        prisma.trip.count({ where }),
      ]);

      res.json({
        success: true,
        data: trips,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get user bookings
  getUserBookings: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10, type, status } = req.query;
      const skip = (page - 1) * limit;

      const where = { userId };
      if (type) where.type = type;
      if (status) where.status = status;

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          select: {
            id: true,
            reference: true,
            type: true,
            status: true,
            paymentStatus: true,
            checkIn: true,
            checkOut: true,
            totalPrice: true,
            currency: true,
            createdAt: true,
            hotel: { select: { id: true, name: true, image: true } },
            attraction: { select: { id: true, name: true, image: true } },
            transport: { select: { id: true, operator: true } },
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.booking.count({ where }),
      ]);

      res.json({
        success: true,
        data: bookings,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Submit attraction
  submitAttraction: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { name, description, destinationId, image, entryFeeGhs, openingHours } = req.body;

      const attraction = await prisma.attraction.create({
        data: {
          name,
          description,
          destinationId,
          image,
          entryFeeGhs,
          openingHours,
          submittedById: userId,
          status: 'PENDING',
        },
      });

      // Queue approval notification
      const { notifyAdminsOfPendingApprovals } = require('../utils/notificationHelpers');
      const pendingCounts = await prisma.attraction.count({ where: { status: 'PENDING' } });
      await notifyAdminsOfPendingApprovals({ attractions: pendingCounts });

      res.json({
        success: true,
        message: 'Attraction submitted for review',
        data: attraction,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Submit review
  submitReview: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { entityType, entityId, rating, comment } = req.body;

      // Validate rating
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      }

      const review = await prisma.review.create({
        data: {
          userId,
          entityType,
          entityId,
          rating,
          comment,
          status: 'PENDING',
        },
      });

      res.json({
        success: true,
        message: 'Review submitted for moderation',
        data: review,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = userContentController;
