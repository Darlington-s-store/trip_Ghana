const prisma = require('../lib/prisma');

/**
 * Get all destinations
 */
exports.getAllDestinations = async (req, res) => {
  try {
    const { skip = 0, take = 10, search, visible } = req.query;

    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (visible !== undefined) {
      where.visible = visible === 'true';
    }

    const [destinations, total] = await Promise.all([
      prisma.destination.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(take),
        include: {
          _count: {
            select: { hotels: true, attractions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.destination.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        destinations,
        total,
        pages: Math.ceil(total / parseInt(take)),
      },
    });
  } catch (error) {
    console.error('[adminDestinationsController] Get all destinations error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get destination details
 */
exports.getDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;

    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
      include: {
        hotels: true,
        attractions: true,
        _count: {
          select: { hotels: true, attractions: true },
        },
      },
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    res.json({
      success: true,
      data: destination,
    });
  } catch (error) {
    console.error('[adminDestinationsController] Get destination error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create destination
 */
exports.createDestination = async (req, res) => {
  try {
    const { name, slug, description, shortDescription, image, region, featured } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required',
      });
    }

    // Check if slug exists
    const existing = await prisma.destination.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Destination with this slug already exists',
      });
    }

    const destination = await prisma.destination.create({
      data: {
        name,
        slug,
        description,
        shortDescription,
        image,
        region,
        featured: featured || false,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'CREATE_DESTINATION',
        resourceType: 'DESTINATION',
        resourceId: destination.id,
        ip: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      data: destination,
    });
  } catch (error) {
    console.error('[adminDestinationsController] Create destination error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update destination
 */
exports.updateDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;
    const { name, slug, description, shortDescription, image, region, featured, visible } = req.body;

    const destination = await prisma.destination.findUnique({ where: { id: destinationId } });
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    const updatedDestination = await prisma.destination.update({
      where: { id: destinationId },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(shortDescription && { shortDescription }),
        ...(image && { image }),
        ...(region && { region }),
        ...(featured !== undefined && { featured }),
        ...(visible !== undefined && { visible }),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'UPDATE_DESTINATION',
        resourceType: 'DESTINATION',
        resourceId: destinationId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'Destination updated successfully',
      data: updatedDestination,
    });
  } catch (error) {
    console.error('[adminDestinationsController] Update destination error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Toggle destination visibility
 */
exports.toggleVisibility = async (req, res) => {
  try {
    const { destinationId } = req.params;

    const destination = await prisma.destination.findUnique({ where: { id: destinationId } });
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    const updatedDestination = await prisma.destination.update({
      where: { id: destinationId },
      data: { visible: !destination.visible },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'TOGGLE_DESTINATION_VISIBILITY',
        resourceType: 'DESTINATION',
        resourceId: destinationId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: `Destination is now ${updatedDestination.visible ? 'visible' : 'hidden'}`,
      data: updatedDestination,
    });
  } catch (error) {
    console.error('[adminDestinationsController] Toggle visibility error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete destination
 */
exports.deleteDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;

    const destination = await prisma.destination.findUnique({ where: { id: destinationId } });
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    await prisma.destination.delete({ where: { id: destinationId } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'DELETE_DESTINATION',
        resourceType: 'DESTINATION',
        resourceId: destinationId,
        ip: req.ip,
      },
    });

    res.json({
      success: true,
      message: 'Destination deleted successfully',
    });
  } catch (error) {
    console.error('[adminDestinationsController] Delete destination error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
