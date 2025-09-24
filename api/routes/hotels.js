const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// GET /hotels/:hotel_id - Get hotel details with room types
router.get('/:hotel_id', async (req, res) => {
  try {
    const { hotel_id } = req.params;

    // Get hotel basic info
    const [hotels] = await pool.execute(`
      SELECT h.hotel_id, h.name, h.address, h.rating,
             c.name as city_name, c.country
      FROM Hotel h
      JOIN City c ON h.city_id = c.city_id
      WHERE h.hotel_id = ?
    `, [hotel_id]);

    if (hotels.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    const hotel = hotels[0];

    // Get room types with current pricing
    const [roomTypes] = await pool.execute(`
      SELECT rt.room_type_id, rt.name, rt.base_price, rt.max_guests,
             GetSeasonalPrice(rt.room_type_id, CURRENT_DATE) as current_price
      FROM RoomType rt
      WHERE rt.hotel_id = ?
      ORDER BY rt.base_price
    `, [hotel_id]);

    // Get hotel rating summary from reviews
    const [ratingSummary] = await pool.execute(`
      SELECT COUNT(r.review_id) as total_reviews,
             ROUND(AVG(r.rating), 1) as average_rating
      FROM Review r
      WHERE r.hotel_id = ?
    `, [hotel_id]);

    res.json({
      success: true,
      data: {
        ...hotel,
        total_reviews: ratingSummary[0]?.total_reviews || 0,
        average_rating: ratingSummary[0]?.average_rating || hotel.rating,
        room_types: roomTypes
      }
    });
  } catch (error) {
    console.error('Get hotel details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hotel details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /hotels/:hotel_id/reviews - Get hotel reviews
router.get('/:hotel_id/reviews', async (req, res) => {
  try {
    const { hotel_id } = req.params;
    const { page = 1, limit = 10, rating_filter } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.review_id, r.rating, r.review_title, r.review_text,
             r.helpful_count, r.created_at, r.is_verified,
             u.full_name as reviewer_name
      FROM Review r
      JOIN \`User\` u ON r.user_id = u.user_id
      WHERE r.hotel_id = ?
    `;
    
    const params = [hotel_id];

    if (rating_filter) {
      query += ' AND r.rating = ?';
      params.push(parseInt(rating_filter));
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [reviews] = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM Review WHERE hotel_id = ?';
    const countParams = [hotel_id];
    
    if (rating_filter) {
      countQuery += ' AND rating = ?';
      countParams.push(parseInt(rating_filter));
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get hotel reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hotel reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;