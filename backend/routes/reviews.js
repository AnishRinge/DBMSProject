const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateReview = [
  body('booking_id').isInt({ min: 1 }).withMessage('Valid booking_id required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review_title').trim().isLength({ min: 5, max: 200 }).withMessage('Review title must be 5-200 characters'),
  body('review_text').trim().isLength({ min: 10, max: 2000 }).withMessage('Review text must be 10-2000 characters')
];

// POST /reviews - Add a new review
router.post('/', authenticateToken, validateReview, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { booking_id, rating, review_title, review_text } = req.body;
    const user_id = req.user.user_id;

    // Use stored procedure to add review with validation
    await pool.execute(`
      CALL AddReview(?, ?, ?, ?, ?)
    `, [booking_id, user_id, rating, review_title, review_text]);

    // Get the created review
    const [reviews] = await pool.execute(`
      SELECT r.review_id, r.rating, r.review_title, r.review_text, 
             r.created_at, r.is_verified,
             h.name as hotel_name, h.hotel_id
      FROM Review r
      JOIN Hotel h ON r.hotel_id = h.hotel_id
      WHERE r.booking_id = ?
    `, [booking_id]);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: reviews[0]
    });
  } catch (error) {
    console.error('Add review error:', error);
    
    // Handle specific database errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this booking'
      });
    }
    
    if (error.message.includes('only review your own')) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own bookings'
      });
    }

    if (error.message.includes('cancelled booking')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot review a cancelled booking'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /reviews/:review_id - Get specific review
router.get('/:review_id', async (req, res) => {
  try {
    const { review_id } = req.params;

    const [reviews] = await pool.execute(`
      SELECT r.review_id, r.rating, r.review_title, r.review_text,
             r.helpful_count, r.created_at, r.is_verified,
             u.full_name as reviewer_name,
             h.name as hotel_name, h.hotel_id,
             c.name as city_name
      FROM Review r
      JOIN \`User\` u ON r.user_id = u.user_id
      JOIN Hotel h ON r.hotel_id = h.hotel_id
      JOIN City c ON h.city_id = c.city_id
      WHERE r.review_id = ?
    `, [review_id]);

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: reviews[0]
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /reviews/:review_id/helpful - Mark review as helpful
router.post('/:review_id/helpful', authenticateToken, async (req, res) => {
  try {
    const { review_id } = req.params;
    const user_id = req.user.user_id;

    // Use stored procedure to mark review as helpful
    await pool.execute(`
      CALL MarkReviewHelpful(?, ?)
    `, [review_id, user_id]);

    res.json({
      success: true,
      message: 'Review marked as helpful'
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    
    if (error.message.includes('already marked')) {
      return res.status(409).json({
        success: false,
        message: 'You have already marked this review as helpful'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /reviews/:review_id - Update review (owner only)
router.put('/:review_id', authenticateToken, validateReview, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { review_id } = req.params;
    const { rating, review_title, review_text } = req.body;
    const user_id = req.user.user_id;

    // Check if user owns this review
    const [reviewCheck] = await pool.execute(`
      SELECT user_id FROM Review WHERE review_id = ?
    `, [review_id]);

    if (reviewCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (reviewCheck[0].user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    // Update review
    await pool.execute(`
      UPDATE Review 
      SET rating = ?, review_title = ?, review_text = ?, updated_at = NOW()
      WHERE review_id = ?
    `, [rating, review_title, review_text, review_id]);

    res.json({
      success: true,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /reviews/:review_id - Delete review (owner only)
router.delete('/:review_id', authenticateToken, async (req, res) => {
  try {
    const { review_id } = req.params;
    const user_id = req.user.user_id;
    const isAdmin = req.user.role === 'ADMIN';

    // Check if user owns this review or is admin
    const [reviewCheck] = await pool.execute(`
      SELECT user_id FROM Review WHERE review_id = ?
    `, [review_id]);

    if (reviewCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (reviewCheck[0].user_id !== user_id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete review (this will also delete helpful votes due to CASCADE)
    await pool.execute(`
      DELETE FROM Review WHERE review_id = ?
    `, [review_id]);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /reviews/recent - Get recent reviews across all hotels
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const [reviews] = await pool.execute(`
      SELECT r.review_id, r.rating, r.review_title, r.review_text,
             r.helpful_count, r.created_at,
             u.full_name as reviewer_name,
             h.name as hotel_name, h.hotel_id,
             c.name as city_name
      FROM Review r
      JOIN \`User\` u ON r.user_id = u.user_id
      JOIN Hotel h ON r.hotel_id = h.hotel_id
      JOIN City c ON h.city_id = c.city_id
      WHERE r.is_verified = TRUE
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get recent reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;