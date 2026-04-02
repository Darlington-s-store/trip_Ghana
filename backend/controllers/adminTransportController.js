const prisma = require('../lib/prisma');

/**
 * Get all transport routes
 */
exports.getAllRoutes = async (req, res) => {
  try {
    const { skip = 0, take = 10, origin, destination, type } = req.query;

    const where = {};
    if (origin) where.origin = { contains: origin, mode: 'insensitive' };
    if (destination) where.destination = { contains: destination, mode: 'insensitive' };
    if (type) where.type = type;

    const [routes, total] = await Promise.all([
      prisma.transportRoute.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(take),
        include: {
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transportRoute.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        routes,
        total,
        pages: Math.ceil(total / parseInt(take)),
      },
    });
  } catch (error) {
    console.error('[adminTransportController] Get all routes error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get route details
 */
exports.getRoute = async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await prisma.transportRoute.findUnique({
      where: { id: routeId },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    res.json({
      success: true,
      data: route,
    });
  } catch (error) {
    console.error('[adminTransportController] Get route error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create transport route
 */
exports.createRoute = async (req, res) => {
  try {
    const { operator, type, origin, destination, priceGhs, schedule } = req.body;

    if (!operator || !type || !origin || !destination || !priceGhs) {
      return res.status(400).json({
        success: false,
        message: 'Operator, type, origin, destination, and price are required',
      });
    }

    const route = await prisma.transportRoute.create({
      data: {
        operator,
        type: type.toUpperCase(),
        origin,
        destination,
        priceGhs: parseFloat(priceGhs),
        schedule,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'CREATE_TRANSPORT_ROUTE',
        resourceType: 'TRANSPORT_ROUTE',
        resourceId: route.id,
        ip: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route,
    });
  } catch (error) {
    console.error('[adminTransportController] Create route error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update transport route
 */
exports.updateRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { operator, type, origin, destination, priceGhs, schedule } = req.body;

    const route = await prisma.transportRoute.findUnique({ where: { id: routeId } });
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    const updatedRoute = await prisma.transportRoute.update({
      where: { id: routeId },
      data: {
        ...(operator && { operator }),
        ...(type && { type: type.toUpperCase() }),
        ...(origin && { origin }),
        ...(destination && { destination }),
        ...(priceGhs && { priceGhs: parseFloat(priceGhs) }),
        ...(schedule && { schedule }),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'UPDATE_TRANSPORT_ROUTE',
        resourceType: 'TRANSPORT_ROUTE',
        resourceId: routeId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'Route updated successfully',
      data: updatedRoute,
    });
  } catch (error) {
    console.error('[adminTransportController] Update route error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete transport route
 */
exports.deleteRoute = async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await prisma.transportRoute.findUnique({ where: { id: routeId } });
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    await prisma.transportRoute.delete({ where: { id: routeId } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'DELETE_TRANSPORT_ROUTE',
        resourceType: 'TRANSPORT_ROUTE',
        resourceId: routeId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'Route deleted successfully',
    });
  } catch (error) {
    console.error('[adminTransportController] Delete route error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get unique origins and destinations
 */
exports.getLocations = async (req, res) => {
  try {
    const [origins, destinations] = await Promise.all([
      prisma.transportRoute.findMany({
        select: { origin: true },
        distinct: ['origin'],
      }),
      prisma.transportRoute.findMany({
        select: { destination: true },
        distinct: ['destination'],
      }),
    ]);

    res.json({
      success: true,
      data: {
        origins: origins.map(o => o.origin),
        destinations: destinations.map(d => d.destination),
      },
    });
  } catch (error) {
    console.error('[adminTransportController] Get locations error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get transport statistics
 */
exports.getTransportStats = async (req, res) => {
  try {
    const [
      totalRoutes,
      busRoutes,
      shuttleRoutes,
      privateRoutes,
      flightRoutes,
      totalOperators,
    ] = await Promise.all([
      prisma.transportRoute.count(),
      prisma.transportRoute.count({ where: { type: 'BUS' } }),
      prisma.transportRoute.count({ where: { type: 'SHUTTLE' } }),
      prisma.transportRoute.count({ where: { type: 'PRIVATE' } }),
      prisma.transportRoute.count({ where: { type: 'FLIGHT' } }),
      prisma.transportRoute.findMany({
        select: { operator: true },
        distinct: ['operator'],
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalRoutes,
        busRoutes,
        shuttleRoutes,
        privateRoutes,
        flightRoutes,
        totalOperators: totalOperators.length,
      },
    });
  } catch (error) {
    console.error('[adminTransportController] Get transport stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
