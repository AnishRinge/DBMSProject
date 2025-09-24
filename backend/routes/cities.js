const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// GET /cities - Get all cities
router.get('/', async (req, res) => {
  try {
    const [cities] = await pool.execute(
      'SELECT city_id, name, country FROM City ORDER BY name'
    );

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /cities/:city_id/hotels - Get hotels in a city
router.get('/:city_id/hotels', async (req, res) => {
  try {
    const { city_id } = req.params;
    const { rating_min, rating_max, sort_by = 'name', order = 'ASC' } = req.query;

    let query = `
      SELECT h.hotel_id, h.name, h.address, h.rating,
             c.name as city_name, c.country,
             COUNT(rt.room_type_id) as room_types_count,
             MIN(rt.base_price) as price_from
      FROM Hotel h
      JOIN City c ON h.city_id = c.city_id
      LEFT JOIN RoomType rt ON h.hotel_id = rt.hotel_id
      WHERE h.city_id = ?
    `;
    
    const params = [city_id];

    // Add rating filters if provided
    if (rating_min) {
      query += ' AND h.rating >= ?';
      params.push(parseFloat(rating_min));
    }
    if (rating_max) {
      query += ' AND h.rating <= ?';
      params.push(parseFloat(rating_max));
    }

    query += ' GROUP BY h.hotel_id, h.name, h.address, h.rating, c.name, c.country';

    // Add sorting
    const validSortFields = ['name', 'rating', 'price_from'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    const [hotels] = await pool.execute(query, params);

    res.json({
      success: true,
      data: hotels
    });
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hotels',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;