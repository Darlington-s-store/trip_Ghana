const pool = require('../db');

/**
 * Get all hotels with optional filtering
 */
exports.getHotels = async (req, res) => {
  try {
    const { destination_id, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM hotels WHERE visible = true';
    const params = [];

    if (destination_id) {
      query += ` AND destination_id = $${params.length + 1}`;
      params.push(destination_id);
    }

    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR location ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM hotels WHERE visible = true';
    const countParams = [];

    if (destination_id) {
      countQuery += ` AND destination_id = $${countParams.length + 1}`;
      countParams.push(destination_id);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('Get hotels error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch hotels' });
  }
};

/**
 * Get single hotel
 */
exports.getHotel = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM hotels WHERE id = $1 AND visible = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get hotel error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch hotel' });
  }
};

/**
 * ADMIN: Create hotel
 */
exports.createHotel = async (req, res) => {
  try {
    // Admin check
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { name, description, location, destination_id, price_per_night, currency, amenities, images } = req.body;

    // Validate
    if (!name || !destination_id || !price_per_night) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO hotels (name, description, location, destination_id, price_per_night, currency, amenities, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, location, destination_id, price_per_night, currency || 'GHS', amenities || '{}', images || '{}']
    );

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.userId, 'CREATE', 'hotel', result.rows[0].id, req.ip]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Create hotel error:', err);
    res.status(500).json({ success: false, message: 'Failed to create hotel' });
  }
};

/**
 * ADMIN: Update hotel
 */
exports.updateHotel = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { id } = req.params;
    const { name, description, location, price_per_night, currency, amenities, images, featured } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    if (location) {
      updates.push(`location = $${paramCount}`);
      params.push(location);
      paramCount++;
    }
    if (price_per_night) {
      updates.push(`price_per_night = $${paramCount}`);
      params.push(price_per_night);
      paramCount++;
    }
    if (currency) {
      updates.push(`currency = $${paramCount}`);
      params.push(currency);
      paramCount++;
    }
    if (amenities) {
      updates.push(`amenities = $${paramCount}`);
      params.push(amenities);
      paramCount++;
    }
    if (images) {
      updates.push(`images = $${paramCount}`);
      params.push(images);
      paramCount++;
    }
    if (featured !== undefined) {
      updates.push(`featured = $${paramCount}`);
      params.push(featured);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No updates provided' });
    }

    params.push(id);
    const query = `UPDATE hotels SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.userId, 'UPDATE', 'hotel', id, req.ip]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update hotel error:', err);
    res.status(500).json({ success: false, message: 'Failed to update hotel' });
  }
};

/**
 * ADMIN: Delete hotel (soft delete via visible flag)
 */
exports.deleteHotel = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'UPDATE hotels SET visible = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.userId, 'DELETE', 'hotel', id, req.ip]
    );

    res.json({ success: true, message: 'Hotel deleted' });
  } catch (err) {
    console.error('Delete hotel error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete hotel' });
  }
};

/**
 * ADMIN: Get statistics
 */
exports.getStats = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const totalResult = await pool.query('SELECT COUNT(*) FROM hotels WHERE visible = true');
    const avgRatingResult = await pool.query('SELECT AVG(rating) FROM hotels WHERE visible = true');
    const featuredResult = await pool.query('SELECT COUNT(*) FROM hotels WHERE visible = true AND featured = true');

    res.json({
      success: true,
      data: {
        totalHotels: parseInt(totalResult.rows[0].count),
        averageRating: avgRatingResult.rows[0].avg ? parseFloat(avgRatingResult.rows[0].avg).toFixed(2) : 0,
        featuredHotels: parseInt(featuredResult.rows[0].count),
      },
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
