const prisma = require('../lib/prisma');

/**
 * Get all attractions with approval filtering
 */
exports.getAllAttractions = async (req, res) => {
  try {
    const { skip = 0, take = 10, search, status, destinationId } = req.query;

    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status) where.status = status;
    if (destinationId) where.destinationId = destinationId;

    const [attractions, total] = await Promise.all([
      prisma.attraction.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(take),
        include: {
          destination: true,
          submittedBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          _count: {
            select: { reviews: true, tripDayAttractions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.attraction.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        attractions,
        total,
        pages: Math.ceil(total / parseInt(take)),
      },
    });
  } catch (error) {
    console.error('[adminAttractionsController] Get all attractions error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get attraction details
 */
exports.getAttraction = async (req, res) => {
  try {
    const { attractionId } = req.params;

    const attraction = await prisma.attraction.findUnique({
      where: { id: attractionId },
      include: {
        destination: true,
        submittedBy: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true },
        },
        reviews: { take: 10 },
        tripDayAttractions: { take: 5 },
        _count: {
          select: { reviews: true, tripDayAttractions: true },
        },
      },
    });

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found',
      });
    }

    res.json({
      success: true,
      data: attraction,
    });
  } catch (error) {
    console.error('[adminAttractionsController] Get attraction error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create attraction (admin)
 */
exports.createAttraction = async (req, res) => {
  try {
    const { name, slug, description, shortDescription, location, destinationId, image, category, entryFee, currency, openingHours } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required',
      });
    }

    // Check if slug exists
    const existing = await prisma.attraction.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Attraction with this slug already exists',
      });
    }

    const attraction = await prisma.attraction.create({
      data: {
        name,
        slug,
        description,
        shortDescription,
        location,
        destinationId,
        image,
        category,
        entryFee: entryFee ? parseFloat(entryFee) : 0,
        currency: currency || 'GHS',
        openingHours,
        status: 'APPROVED', // Admin-created attractions are auto-approved
      },
      include: {
        destination: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'CREATE_ATTRACTION',
        resourceType: 'ATTRACTION',
        resourceId: attraction.id,
        ip: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Attraction created successfully',
      data: attraction,
    });
  } catch (error) {
    console.error('[adminAttractionsController] Create attraction error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update attraction
 */
exports.updateAttraction = async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { name, slug, description, shortDescription, location, destinationId, image, category, entryFee, currency, openingHours } = req.body;

    const attraction = await prisma.attraction.findUnique({ where: { id: attractionId } });
    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found',
      });
    }

    const updatedAttraction = await prisma.attraction.update({
      where: { id: attractionId },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(shortDescription && { shortDescription }),
        ...(location && { location }),
        ...(destinationId && { destinationId }),
        ...(image && { image }),
        ...(category && { category }),
        ...(entryFee !== undefined && { entryFee: parseFloat(entryFee) }),
        ...(currency && { currency }),
        ...(openingHours && { openingHours }),
      },
      include: {
        destination: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'UPDATE_ATTRACTION',
        resourceType: 'ATTRACTION',
        resourceId: attractionId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'Attraction updated successfully',
      data: updatedAttraction,
    });
  } catch (error) {
    console.error('[adminAttractionsController] Update attraction error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Approve user-submitted attraction
 */
exports.approveAttraction = async (req, res) => {
  try {
    const { attractionId } = req.params;

    const attraction = await prisma.attraction.findUnique({
      where: { id: attractionId },
      include: { submittedBy: true },
    });

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found',
      });
    }

    const updatedAttraction = await prisma.attraction.update({
      where: { id: attractionId },
      data: { status: 'APPROVED' },
      include: { submittedBy: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'APPROVE_ATTRACTION',
        resourceType: 'ATTRACTION',
        resourceId: attractionId,
        ip: req.ip,
      },
    });

    // Notify submitter
    if (attraction.submittedBy) {
      await prisma.notification.create({
        data: {
          userId: attraction.submittedBy.id,
          title: 'Attraction Approved',
          message: `Your attraction "${updatedAttraction.name}" has been approved and is now visible to all users!`,
          type: 'SYSTEM',
          channel: 'EMAIL',
        },
      });
    }

    res.json({
      success: true,
      message: 'Attraction approved successfully',
      data: updatedAttraction,
    });
  } catch (error) {
    console.error('[adminAttractionsController] Approve attraction error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reject user-submitted attraction
 */
exports.rejectAttraction = async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const attraction = await prisma.attraction.findUnique({
      where: { id: attractionId },
      include: { submittedBy: true },
    });

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found',
      });
    }

    const updatedAttraction = await prisma.attraction.update({
      where: { id: attractionId },
      data: { status: 'REJECTED' },
      include: { submittedBy: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'REJECT_ATTRACTION',
        resourceType: 'ATTRACTION',
        resourceId: attractionId,
        ip: req.ip,
      },
    });

    // Notify submitter
    if (attraction.submittedBy) {
      await prisma.notification.create({
        data: {
          userId: attraction.submittedBy.id,
          title: 'Attraction Submission Rejected',
          message: `Your attraction submission "${attraction.name}" was not approved. Reason: ${reason}`,
          type: 'SYSTEM',
          channel: 'EMAIL',
        },
      });
    }

    res.json({
      success: true,
      message: 'Attraction rejected',
      data: updatedAttraction,
    });
  } catch (error) {
    console.error('[adminAttractionsController] Reject attraction error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get pending attractions for approval
 */
exports.getPendingAttractions = async (req, res) => {
  try {
    const { skip = 0, take = 10 } = req.query;

    const [attractions, total] = await Promise.all([
      prisma.attraction.findMany({
        where: { status: 'PENDING' },
        skip: parseInt(skip),
        take: parseInt(take),
        include: {
          destination: true,
          submittedBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.attraction.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      success: true,
      data: {
        attractions,
        total,
        pages: Math.ceil(total / parseInt(take)),
      },
    });
  } catch (error) {
    console.error('[adminAttractionsController] Get pending attractions error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete attraction
 */
exports.deleteAttraction = async (req, res) => {
  try {
    const { attractionId } = req.params;

    const attraction = await prisma.attraction.findUnique({ where: { id: attractionId } });
    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found',
      });
    }

    await prisma.attraction.delete({ where: { id: attractionId } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'DELETE_ATTRACTION',
        resourceType: 'ATTRACTION',
        resourceId: attractionId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'Attraction deleted successfully',
    });
  } catch (error) {
    console.error('[adminAttractionsController] Delete attraction error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
