const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

/**
 * Get all users with pagination and filters
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { skip = 0, take = 10, search, status, role } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(take),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: { trips: true, bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        total,
        pages: Math.ceil(total / parseInt(take)),
      },
    });
  } catch (error) {
    console.error('[adminUsersController] Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get single user details
 */
exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trips: { take: 5, orderBy: { createdAt: 'desc' } },
        bookings: { take: 5, orderBy: { createdAt: 'desc' } },
        payments: { take: 5, orderBy: { createdAt: 'desc' } },
        _count: {
          select: { trips: true, bookings: true, payments: true, reviews: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[adminUsersController] Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Suspend user account
 */
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'SUSPEND_USER',
        resourceType: 'USER',
        resourceId: userId,
        ip: req.ip,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Account Suspended',
        message: reason || 'Your account has been suspended. Please contact support for more information.',
        type: 'SYSTEM',
        channel: 'EMAIL',
      },
    });

    res.json({
      success: true,
      message: 'User suspended successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('[adminUsersController] Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Activate suspended user
 */
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'ACTIVATE_USER',
        resourceType: 'USER',
        resourceId: userId,
        ip: req.ip,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Account Activated',
        message: 'Your account has been reactivated. You can now log in.',
        type: 'SYSTEM',
        channel: 'EMAIL',
      },
    });

    res.json({
      success: true,
      message: 'User activated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('[adminUsersController] Activate user error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reset user password
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'RESET_USER_PASSWORD',
        resourceType: 'USER',
        resourceId: userId,
        ip: req.ip,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Password Reset',
        message: 'Your password has been reset by an administrator. Your new temporary password is: ' + newPassword,
        type: 'SYSTEM',
        channel: 'EMAIL',
      },
    });

    res.json({
      success: true,
      message: 'User password reset successfully',
    });
  } catch (error) {
    console.error('[adminUsersController] Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete user account
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete by deactivating
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: 'DEACTIVATED' },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'DELETE_USER',
        resourceType: 'USER',
        resourceId: userId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error) {
    console.error('[adminUsersController] Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user statistics
 */
exports.getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      admins,
      newUsersThisMonth,
      totalTrips,
      totalBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
      prisma.trip.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amountGhs: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        admins,
        newUsersThisMonth,
        totalTrips,
        totalBookings,
        totalRevenue: totalRevenue._sum.amountGhs || 0,
      },
    });
  } catch (error) {
    console.error('[adminUsersController] Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
