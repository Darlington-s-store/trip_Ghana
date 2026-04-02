const prisma = require('../lib/prisma');

/**
 * Get all hotels
 */
exports.getAllHotels = async (req, res) => {
  try {
    const { skip = 0, take = 10, search, destinationId, visible } = req.query;

    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (destinationId) where.destinationId = destinationId;
    if (visible !== undefined) {
      where.visible = visible === 'true';
    }

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(take),
        include: {
          destination: true,
          roomTypes: true,
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hotel.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        hotels,
        total,
        pages: Math.ceil(total / parseInt(take)),
      },
    });
  } catch (error) {
    console.error('[adminHotelsController] Get all hotels error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get hotel details
 */
exports.getHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        destination: true,
        roomTypes: true,
        bookings: { take: 10 },
        reviews: { take: 5 },
        _count: {
          select: { bookings: true, reviews: true, roomTypes: true },
        },
      },
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    res.json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error('[adminHotelsController] Get hotel error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create hotel
 */
exports.createHotel = async (req, res) => {
  try {
    const { name, slug, description, location, destinationId, pricePerNight, currency, amenities, roomTypes } = req.body;

    if (!name || !slug || !pricePerNight) {
      return res.status(400).json({
        success: false,
        message: 'Name, slug, and price per night are required',
      });
    }

    // Check if slug exists
    const existing = await prisma.hotel.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Hotel with this slug already exists',
      });
    }

    const hotel = await prisma.hotel.create({
      data: {
        name,
        slug,
        description,
        location,
        destinationId,
        pricePerNight: parseFloat(pricePerNight),
        currency: currency || 'GHS',
        amenities: amenities || [],
        roomTypes: roomTypes ? {
          createMany: {
            data: roomTypes.map(rt => ({
              name: rt.name,
              capacity: rt.capacity,
              price: parseFloat(rt.price),
              amenities: rt.amenities || [],
            })),
          },
        } : undefined,
      },
      include: {
        roomTypes: true,
        destination: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'CREATE_HOTEL',
        resourceType: 'HOTEL',
        resourceId: hotel.id,
        ip: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: hotel,
    });
  } catch (error) {
    console.error('[adminHotelsController] Create hotel error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update hotel
 */
exports.updateHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { name, slug, description, location, destinationId, pricePerNight, currency, amenities, featured, visible } = req.body;

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(location && { location }),
        ...(destinationId && { destinationId }),
        ...(pricePerNight && { pricePerNight: parseFloat(pricePerNight) }),
        ...(currency && { currency }),
        ...(amenities && { amenities }),
        ...(featured !== undefined && { featured }),
        ...(visible !== undefined && { visible }),
      },
      include: {
        roomTypes: true,
        destination: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'UPDATE_HOTEL',
        resourceType: 'HOTEL',
        resourceId: hotelId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'Hotel updated successfully',
      data: updatedHotel,
    });
  } catch (error) {
    console.error('[adminHotelsController] Update hotel error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create room type
 */
exports.createRoomType = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { name, capacity, price, amenities } = req.body;

    if (!name || !capacity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, capacity, and price are required',
      });
    }

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    const roomType = await prisma.hotelRoomType.create({
      data: {
        hotelId,
        name,
        capacity: parseInt(capacity),
        price: parseFloat(price),
        amenities: amenities || [],
      },
    });

    res.status(201).json({
      success: true,
      message: 'Room type created successfully',
      data: roomType,
    });
  } catch (error) {
    console.error('[adminHotelsController] Create room type error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update room type
 */
exports.updateRoomType = async (req, res) => {
  try {
    const { hotelId, roomTypeId } = req.params;
    const { name, capacity, price, amenities } = req.body;

    const roomType = await prisma.hotelRoomType.findUnique({ where: { id: roomTypeId } });
    if (!roomType || roomType.hotelId !== hotelId) {
      return res.status(404).json({
        success: false,
        message: 'Room type not found',
      });
    }

    const updatedRoomType = await prisma.hotelRoomType.update({
      where: { id: roomTypeId },
      data: {
        ...(name && { name }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(price && { price: parseFloat(price) }),
        ...(amenities && { amenities }),
      },
    });

    res.json({
      success: true,
      message: 'Room type updated successfully',
      data: updatedRoomType,
    });
  } catch (error) {
    console.error('[adminHotelsController] Update room type error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete room type
 */
exports.deleteRoomType = async (req, res) => {
  try {
    const { hotelId, roomTypeId } = req.params;

    const roomType = await prisma.hotelRoomType.findUnique({ where: { id: roomTypeId } });
    if (!roomType || roomType.hotelId !== hotelId) {
      return res.status(404).json({
        success: false,
        message: 'Room type not found',
      });
    }

    await prisma.hotelRoomType.delete({ where: { id: roomTypeId } });

    res.json({
      success: true,
      message: 'Room type deleted successfully',
    });
  } catch (error) {
    console.error('[adminHotelsController] Delete room type error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete hotel
 */
exports.deleteHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    await prisma.hotel.delete({ where: { id: hotelId } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'DELETE_HOTEL',
        resourceType: 'HOTEL',
        resourceId: hotelId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'Hotel deleted successfully',
    });
  } catch (error) {
    console.error('[adminHotelsController] Delete hotel error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
