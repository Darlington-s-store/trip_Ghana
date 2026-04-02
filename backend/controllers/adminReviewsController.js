const prisma = require('../lib/prisma');

/**
 * Get all reviews for moderation
 */
exports.getAllReviews = async (req, res) => {
  try {
    const { skip = 0, take = 10, status, entityType, rating } = req.query;

    const where = {};
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (rating) where.rating = parseInt(rating);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
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
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        total,
        pages: Math.ceil(total / parseInt(take)),
      },
    });
  } catch (error) {
    console.error('[adminReviewsController] Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get review details
 */
exports.getReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('[adminReviewsController] Get review error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Approve review
 */
exports.approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { featured } = req.body;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'APPROVED',
        featured: featured || false,
      },
      include: { user: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'APPROVE_REVIEW',
        resourceType: 'REVIEW',
        resourceId: reviewId,
        ip: req.ip,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: review.userId,
        title: 'Review Approved',
        message: 'Your review has been approved and is now visible to other users!',
        type: 'SYSTEM',
        channel: 'IN_APP',
      },
    });

    res.json({
      success: true,
      message: 'Review approved successfully',
      data: updatedReview,
    });
  } catch (error) {
    console.error('[adminReviewsController] Approve review error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reject review
 */
exports.rejectReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { status: 'REJECTED' },
      include: { user: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'REJECT_REVIEW',
        resourceType: 'REVIEW',
        resourceId: reviewId,
        ip: req.ip,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: review.userId,
        title: 'Review Rejected',
        message: `Your review was not approved. Reason: ${reason || 'Violates community guidelines'}`,
        type: 'SYSTEM',
        channel: 'EMAIL',
      },
    });

    res.json({
      success: true,
      message: 'Review rejected successfully',
      data: updatedReview,
    });
  } catch (error) {
    console.error('[adminReviewsController] Reject review error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Toggle featured status
 */
exports.toggleFeatured = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { featured: !review.featured },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'TOGGLE_REVIEW_FEATURED',
        resourceType: 'REVIEW',
        resourceId: reviewId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: `Review ${updatedReview.featured ? 'featured' : 'unfeatured'} successfully`,
      data: updatedReview,
    });
  } catch (error) {
    console.error('[adminReviewsController] Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete review
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'DELETE_REVIEW',
        resourceType: 'REVIEW',
        resourceId: reviewId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('[adminReviewsController] Delete review error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get pending reviews
 */
exports.getPendingReviews = async (req, res) => {
  try {
    const { skip = 0, take = 10 } = req.query;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { status: 'PENDING' },
        skip: parseInt(skip),
        take: parseInt(take),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.review.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        total,
        pages: Math.ceil(total / parseInt(take)),
      },
    });
  } catch (error) {
    console.error('[adminReviewsController] Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get review statistics
 */
exports.getReviewStats = async (req, res) => {
  try {
    const [
      totalReviews,
      pendingReviews,
      approvedReviews,
      rejectedReviews,
      featuredReviews,
      avgRating,
      reviewsByEntityType,
    ] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { status: 'APPROVED' } }),
      prisma.review.count({ where: { status: 'REJECTED' } }),
      prisma.review.count({ where: { featured: true } }),
      prisma.review.aggregate({
        _avg: { rating: true },
      }),
      prisma.review.groupBy({
        by: ['entityType'],
        _count: { id: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalReviews,
        pendingReviews,
        approvedReviews,
        rejectedReviews,
        featuredReviews,
        avgRating: avgRating._avg.rating?.toFixed(1) || 0,
        reviewsByEntityType,
      },
    });
  } catch (error) {
    console.error('[adminReviewsController] Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
