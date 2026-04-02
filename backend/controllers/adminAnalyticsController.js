const prisma = require('../lib/prisma');

/**
 * Get dashboard overview statistics
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTrips,
      totalBookings,
      totalPayments,
      activeUsersLastMonth,
      newUsersLastMonth,
      completedBookingsLastMonth,
      totalRevenueLastMonth,
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.trip.count(),
      prisma.booking.count(),
      prisma.payment.count({ where: { status: 'SUCCESS' } }),
      prisma.user.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
        _sum: { amountGhs: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTrips,
        totalBookings,
        totalPayments,
        activeUsersLastMonth,
        newUsersLastMonth,
        completedBookingsLastMonth,
        totalRevenueLastMonth: totalRevenueLastMonth._sum.amountGhs || 0,
      },
    });
  } catch (error) {
    console.error('[adminAnalyticsController] Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get revenue analytics
 */
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date(new Date().setDate(new Date().getDate() - parseInt(days)));

    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        amountGhs: true,
        amountUsd: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const revenueByDate = {};
    payments.forEach((payment) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = { ghs: 0, usd: 0, count: 0 };
      }
      revenueByDate[date].ghs += payment.amountGhs;
      revenueByDate[date].usd += payment.amountUsd || 0;
      revenueByDate[date].count += 1;
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amountGhs, 0);
    const totalTransactions = payments.length;

    res.json({
      success: true,
      data: {
        revenueByDate,
        totalRevenue,
        totalTransactions,
        avgTransactionValue: totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error('[adminAnalyticsController] Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user growth analytics
 */
exports.getUserGrowthAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date(new Date().setDate(new Date().getDate() - parseInt(days)));

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        role: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const usersByDate = {};
    users.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      if (!usersByDate[date]) {
        usersByDate[date] = { total: 0, admins: 0, active: 0 };
      }
      usersByDate[date].total += 1;
      if (user.role === 'ADMIN') usersByDate[date].admins += 1;
      if (user.status === 'ACTIVE') usersByDate[date].active += 1;
    });

    res.json({
      success: true,
      data: {
        usersByDate,
        totalNewUsers: users.length,
        totalAdmins: users.filter(u => u.role === 'ADMIN').length,
      },
    });
  } catch (error) {
    console.error('[adminAnalyticsController] Get user growth analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get booking analytics
 */
exports.getBookingAnalytics = async (req, res) => {
  try {
    const bookings = await prisma.booking.groupBy({
      by: ['type', 'status'],
      _count: { id: true },
      _sum: { totalPrice: true },
    });

    const bookingsByType = {};
    bookings.forEach((b) => {
      if (!bookingsByType[b.type]) {
        bookingsByType[b.type] = {};
      }
      bookingsByType[b.type][b.status] = {
        count: b._count.id,
        revenue: b._sum.totalPrice || 0,
      };
    });

    res.json({
      success: true,
      data: {
        bookingsByType,
        totalBookings: bookings.reduce((sum, b) => sum + b._count.id, 0),
        totalRevenue: bookings.reduce((sum, b) => sum + (b._sum.totalPrice || 0), 0),
      },
    });
  } catch (error) {
    console.error('[adminAnalyticsController] Get booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get trip analytics
 */
exports.getTripAnalytics = async (req, res) => {
  try {
    const trips = await prisma.trip.groupBy({
      by: ['status'],
      _count: { id: true },
      _avg: { budget: true },
      _sum: { budget: true },
    });

    const tripsByStatus = {};
    trips.forEach((t) => {
      tripsByStatus[t.status] = {
        count: t._count.id,
        avgBudget: t._avg.budget?.toFixed(2) || 0,
        totalBudget: t._sum.budget || 0,
      };
    });

    const popularDestinations = await prisma.trip.findMany({
      select: { destinations: true },
      where: { status: 'APPROVED' },
    });

    const destinationCounts = {};
    popularDestinations.forEach((trip) => {
      trip.destinations.forEach((dest) => {
        destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
      });
    });

    res.json({
      success: true,
      data: {
        tripsByStatus,
        popularDestinations: Object.entries(destinationCounts)
          .map(([destination, count]) => ({ destination, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        totalTrips: trips.reduce((sum, t) => sum + t._count.id, 0),
      },
    });
  } catch (error) {
    console.error('[adminAnalyticsController] Get trip analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get audit log summary
 */
exports.getAuditLogSummary = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date(new Date().setDate(new Date().getDate() - parseInt(days)));

    const auditLogs = await prisma.auditLog.groupBy({
      by: ['action', 'resourceType'],
      _count: { id: true },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    const actionsByType = {};
    auditLogs.forEach((log) => {
      const key = `${log.action}_${log.resourceType}`;
      actionsByType[key] = log._count.id;
    });

    res.json({
      success: true,
      data: {
        actionsByType,
        totalActions: auditLogs.reduce((sum, log) => sum + log._count.id, 0),
        period: `Last ${days} days`,
      },
    });
  } catch (error) {
    console.error('[adminAnalyticsController] Get audit log summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get top performers (hotels, attractions, guides)
 */
exports.getTopPerformers = async (req, res) => {
  try {
    const [topHotels, topAttractions, topUsers] = await Promise.all([
      prisma.hotel.findMany({
        select: {
          id: true,
          name: true,
          rating: true,
          reviewCount: true,
          _count: { select: { bookings: true } },
        },
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
        take: 5,
      }),
      prisma.attraction.findMany({
        select: {
          id: true,
          name: true,
          rating: true,
          _count: { select: { reviews: true, tripDayAttractions: true } },
        },
        orderBy: { rating: 'desc' },
        take: 5,
      }),
      prisma.user.findMany({
        where: { role: 'USER' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          _count: { select: { trips: true, bookings: true, reviews: true } },
        },
        orderBy: [{ createdAt: 'asc' }],
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      data: {
        topHotels,
        topAttractions,
        topUsers,
      },
    });
  } catch (error) {
    console.error('[adminAnalyticsController] Get top performers error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
