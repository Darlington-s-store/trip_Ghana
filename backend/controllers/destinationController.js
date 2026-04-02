const pool = require('../db');

class DestinationController {
  async getAllDestinations(req, res) {
    try {
      const result = await pool.query(
        `SELECT * FROM destinations WHERE visible = true ORDER BY featured DESC, name ASC`
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDestinationById(req, res) {
    const { destinationId } = req.params;
    try {
      const result = await pool.query('SELECT * FROM destinations WHERE id = $1 AND visible = true', [destinationId]);
      if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Destination not found' });
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async searchDestinations(req, res) {
    const { query } = req.query;
    try {
      const result = await pool.query(
        `SELECT * FROM destinations WHERE visible = true AND (name ILIKE $1 OR region ILIKE $1) ORDER BY name`,
        [`%${query}%`]
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new DestinationController();
