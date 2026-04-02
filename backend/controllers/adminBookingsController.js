const prisma = require('../lib/prisma');

/**
 * Get all bookings
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { skip = 0, take = 10, status, type, userId, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (userId) where.userId = userId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
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
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        total,
        pages: Math.ceil(total / parseInt(take)),
      },
    });
  } catch (error) {
    console.error('[adminBookingsController] Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get booking details
 */
exports.getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
        payment: true,
        hotel: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('[adminBookingsController] Get booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Confirm booking
 */
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
      include: { user: true, payment: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'CONFIRM_BOOKING',
        resourceType: 'BOOKING',
        resourceId: bookingId,
        ip: req.ip,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Confirmed',
        message: `Your ${booking.type.toLowerCase()} booking has been confirmed!`,
        type: 'BOOKING',
        channel: 'EMAIL',
      },
    });

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: updatedBooking,
    });
  } catch (error) {
    console.error('[adminBookingsController] Confirm booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cancel booking
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, payment: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
      include: { user: true, payment: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'CANCEL_BOOKING',
        resourceType: 'BOOKING',
        resourceId: bookingId,
        ip: req.ip,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Cancelled',
        message: `Your ${booking.type.toLowerCase()} booking has been cancelled. Reason: ${reason || 'No reason provided'}`,
        type: 'BOOKING',
        channel: 'EMAIL',
      },
    });

    // Handle refund if payment was made
    if (booking.payment && booking.payment.status === 'SUCCESS') {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: { status: 'REVERSED' },
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking,
    });
  } catch (error) {
    console.error('[adminBookingsController] Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get booking statistics
 */
exports.getBookingStats = async (req, res) => {
  try {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      hotelBookings,
      attractionBookings,
      transportBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { type: 'HOTEL' } }),
      prisma.booking.count({ where: { type: 'ATTRACTION' } }),
      prisma.booking.count({ where: { type: 'TRANSPORT' } }),
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        hotelBookings,
        attractionBookings,
        transportBookings,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
      },
    });
  } catch (error) {
    console.error('[adminBookingsController] Get booking stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get bookings by date range
 */
exports.getBookingsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        bookings,
        total: bookings.length,
      },
    });
  } catch (error) {
    console.error('[adminBookingsController] Get bookings by date range error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
