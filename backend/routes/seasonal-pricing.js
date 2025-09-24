const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateSeasonalPricing = [
  body('room_type_id').isInt({ min: 1 }).withMessage('Valid room_type_id required'),
  body('season_name').trim().isLength({ min: 3, max: 50 }).withMessage('Season name must be 3-50 characters'),
  body('start_date').isDate().withMessage('Valid start_date required (YYYY-MM-DD)'),
  body('end_date').isDate().withMessage('Valid end_date required (YYYY-MM-DD)'),
  body('price_multiplier').isFloat({ min: 0.1, max: 5.0 }).withMessage('Price multiplier must be between 0.1 and 5.0'),
  body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('Priority must be between 1 and 10'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters')
];

// GET /seasonal-pricing - Get all seasonal pricing
router.get('/', async (req, res) => {
  try {
    const { room_type_id, hotel_id, is_active, date } = req.query;

    let query = `
      SELECT sp.pricing_id, sp.room_type_id, sp.season_name, sp.description,
             sp.start_date, sp.end_date, sp.price_multiplier, sp.is_active, sp.priority,
             sp.created_at, sp.updated_at,
             rt.name as room_type_name, rt.base_price,
             h.name as hotel_name, h.hotel_id
      FROM SeasonalPricing sp
      JOIN RoomType rt ON sp.room_type_id = rt.room_type_id
      JOIN Hotel h ON rt.hotel_id = h.hotel_id
      WHERE 1=1
    `;

    const params = [];

    if (room_type_id) {
      query += ' AND sp.room_type_id = ?';
      params.push(parseInt(room_type_id));
    }

    if (hotel_id) {
      query += ' AND h.hotel_id = ?';
      params.push(parseInt(hotel_id));
    }

    if (is_active !== undefined) {
      query += ' AND sp.is_active = ?';
      params.push(is_active === 'true');
    }

    if (date) {
      query += ' AND ? BETWEEN sp.start_date AND sp.end_date';
      params.push(date);
    }

    query += ' ORDER BY sp.priority DESC, sp.start_date';

    const [pricingRules] = await pool.execute(query, params);

    res.json({
      success: true,
      data: pricingRules
    });
  } catch (error) {
    console.error('Get seasonal pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seasonal pricing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /seasonal-pricing - Add new seasonal pricing (Admin only)
router.post('/', authenticateToken, requireAdmin, validateSeasonalPricing, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      room_type_id, 
      season_name, 
      description, 
      start_date, 
      end_date, 
      price_multiplier, 
      priority = 1 
    } = req.body;

    // Use stored procedure to add seasonal pricing with validation
    await pool.execute(`
      CALL AddSeasonalPricing(?, ?, ?, ?, ?, ?, ?)
    `, [room_type_id, season_name, description, start_date, end_date, price_multiplier, priority]);

    // Get the created pricing rule
    const [newPricing] = await pool.execute(`
      SELECT sp.pricing_id, sp.room_type_id, sp.season_name, sp.description,
             sp.start_date, sp.end_date, sp.price_multiplier, sp.priority,
             rt.name as room_type_name, rt.base_price,
             h.name as hotel_name
      FROM SeasonalPricing sp
      JOIN RoomType rt ON sp.room_type_id = rt.room_type_id
      JOIN Hotel h ON rt.hotel_id = h.hotel_id
      WHERE sp.room_type_id = ? AND sp.season_name = ? AND sp.start_date = ?
      ORDER BY sp.created_at DESC
      LIMIT 1
    `, [room_type_id, season_name, start_date]);

    res.status(201).json({
      success: true,
      message: 'Seasonal pricing created successfully',
      data: newPricing[0]
    });
  } catch (error) {
    console.error('Add seasonal pricing error:', error);
    
    if (error.message.includes('Start date must be before end date')) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    if (error.message.includes('Price multiplier must be between')) {
      return res.status(400).json({
        success: false,
        message: 'Price multiplier must be between 0 and 5.0'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create seasonal pricing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /seasonal-pricing/:pricing_id - Get specific pricing rule
router.get('/:pricing_id', async (req, res) => {
  try {
    const { pricing_id } = req.params;

    const [pricingRules] = await pool.execute(`
      SELECT sp.pricing_id, sp.room_type_id, sp.season_name, sp.description,
             sp.start_date, sp.end_date, sp.price_multiplier, sp.is_active, sp.priority,
             sp.created_at, sp.updated_at,
             rt.name as room_type_name, rt.base_price,
             h.name as hotel_name, h.hotel_id,
             c.name as city_name
      FROM SeasonalPricing sp
      JOIN RoomType rt ON sp.room_type_id = rt.room_type_id
      JOIN Hotel h ON rt.hotel_id = h.hotel_id
      JOIN City c ON h.city_id = c.city_id
      WHERE sp.pricing_id = ?
    `, [pricing_id]);

    if (pricingRules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seasonal pricing rule not found'
      });
    }

    res.json({
      success: true,
      data: pricingRules[0]
    });
  } catch (error) {
    console.error('Get pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing rule',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /seasonal-pricing/:pricing_id - Update pricing rule (Admin only)
router.put('/:pricing_id', authenticateToken, requireAdmin, validateSeasonalPricing, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { pricing_id } = req.params;
    const { 
      season_name, 
      description, 
      start_date, 
      end_date, 
      price_multiplier, 
      priority,
      is_active 
    } = req.body;

    // Check if pricing rule exists
    const [existingRule] = await pool.execute(`
      SELECT pricing_id FROM SeasonalPricing WHERE pricing_id = ?
    `, [pricing_id]);

    if (existingRule.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seasonal pricing rule not found'
      });
    }

    // Validate dates
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Update pricing rule
    await pool.execute(`
      UPDATE SeasonalPricing 
      SET season_name = ?, description = ?, start_date = ?, end_date = ?,
          price_multiplier = ?, priority = ?, is_active = ?, updated_at = NOW()
      WHERE pricing_id = ?
    `, [season_name, description, start_date, end_date, price_multiplier, 
        priority, is_active !== undefined ? is_active : true, pricing_id]);

    res.json({
      success: true,
      message: 'Seasonal pricing updated successfully'
    });
  } catch (error) {
    console.error('Update seasonal pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seasonal pricing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /seasonal-pricing/:pricing_id - Delete pricing rule (Admin only)
router.delete('/:pricing_id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { pricing_id } = req.params;

    const [result] = await pool.execute(`
      DELETE FROM SeasonalPricing WHERE pricing_id = ?
    `, [pricing_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seasonal pricing rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Seasonal pricing deleted successfully'
    });
  } catch (error) {
    console.error('Delete seasonal pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete seasonal pricing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /seasonal-pricing/room-types/:room_type_id/current-price - Get current price for a room type
router.get('/room-types/:room_type_id/current-price', async (req, res) => {
  try {
    const { room_type_id } = req.params;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const [priceInfo] = await pool.execute(`
      SELECT rt.room_type_id, rt.name as room_type_name, rt.base_price,
             GetSeasonalPrice(rt.room_type_id, ?) as current_price,
             h.name as hotel_name,
             sp.season_name, sp.price_multiplier
      FROM RoomType rt
      JOIN Hotel h ON rt.hotel_id = h.hotel_id
      LEFT JOIN SeasonalPricing sp ON rt.room_type_id = sp.room_type_id 
        AND ? BETWEEN sp.start_date AND sp.end_date 
        AND sp.is_active = TRUE
      WHERE rt.room_type_id = ?
      ORDER BY sp.priority DESC
      LIMIT 1
    `, [date, date, room_type_id]);

    if (priceInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room type not found'
      });
    }

    const roomInfo = priceInfo[0];
    const priceChangePercent = roomInfo.price_multiplier ? 
      Math.round(((roomInfo.price_multiplier - 1) * 100) * 100) / 100 : 0;

    res.json({
      success: true,
      data: {
        room_type_id: parseInt(room_type_id),
        room_type_name: roomInfo.room_type_name,
        hotel_name: roomInfo.hotel_name,
        base_price: parseFloat(roomInfo.base_price),
        current_price: parseFloat(roomInfo.current_price),
        price_change_percent: priceChangePercent,
        active_season: roomInfo.season_name || null,
        date
      }
    });
  } catch (error) {
    console.error('Get current price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current price',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;