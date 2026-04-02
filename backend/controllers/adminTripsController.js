const prisma = require('../lib/prisma');

/**
 * Get all trips with filters
 */
exports.getAllTrips = async (req, res) => {
  try {
    const { skip = 0, take = 10, status, userId, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(take),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          days: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.trip.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        trips,
        total,
        pages: Math.ceil(total / parseInt(take)),
      },
    });
  } catch (error) {
    console.error('[adminTripsController] Get all trips error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get trip details
 */
exports.getTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        days: {
          include: {
            attractions: {
              include: {
                attraction: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error('[adminTripsController] Get trip error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Approve trip
 */
exports.approveTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { status: 'APPROVED' },
      include: { user: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'APPROVE_TRIP',
        resourceType: 'TRIP',
        resourceId: tripId,
        ip: req.ip,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: updatedTrip.userId,
        title: 'Trip Approved',
        message: `Your trip "${updatedTrip.name}" has been approved!`,
        type: 'TRIP',
        channel: 'EMAIL',
      },
    });

    res.json({
      success: true,
      message: 'Trip approved successfully',
      data: updatedTrip,
    });
  } catch (error) {
    console.error('[adminTripsController] Approve trip error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reject trip
 */
exports.rejectTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
      include: { user: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'REJECT_TRIP',
        resourceType: 'TRIP',
        resourceId: tripId,
        ip: req.ip,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: updatedTrip.userId,
        title: 'Trip Rejected',
        message: `Your trip "${updatedTrip.name}" was rejected. Reason: ${reason}`,
        type: 'TRIP',
        channel: 'EMAIL',
      },
    });

    res.json({
      success: true,
      message: 'Trip rejected successfully',
      data: updatedTrip,
    });
  } catch (error) {
    console.error('[adminTripsController] Reject trip error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete trip
 */
exports.deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    await prisma.trip.delete({ where: { id: tripId } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'DELETE_TRIP',
        resourceType: 'TRIP',
        resourceId: tripId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    console.error('[adminTripsController] Delete trip error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get trip statistics
 */
exports.getTripStats = async (req, res) => {
  try {
    const [
      totalTrips,
      approvedTrips,
      pendingTrips,
      rejectedTrips,
      completedTrips,
      avgBudget,
    ] = await Promise.all([
      prisma.trip.count(),
      prisma.trip.count({ where: { status: 'APPROVED' } }),
      prisma.trip.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.trip.count({ where: { status: 'REJECTED' } }),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.trip.aggregate({
        _avg: { budget: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalTrips,
        approvedTrips,
        pendingTrips,
        rejectedTrips,
        completedTrips,
        avgBudget: avgBudget._avg.budget || 0,
      },
    });
  } catch (error) {
    console.error('[adminTripsController] Get trip stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
