const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Validation middleware
const validateAvailability = [
  query('check_in').isDate().withMessage('Valid check_in date required (YYYY-MM-DD)'),
  query('check_out').isDate().withMessage('Valid check_out date required (YYYY-MM-DD)')
];

// GET /roomtypes/:room_type_id/availability - Check room availability
router.get('/:room_type_id/availability', validateAvailability, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { room_type_id } = req.params;
    const { check_in, check_out } = req.query;

    // Validate dates
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past'
      });
    }

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    // Check if room type exists
    const [roomTypes] = await pool.execute(`
      SELECT rt.room_type_id, rt.name, rt.base_price, rt.max_guests,
             h.name as hotel_name,
             GetSeasonalPrice(rt.room_type_id, ?) as current_price
      FROM RoomType rt
      JOIN Hotel h ON rt.hotel_id = h.hotel_id
      WHERE rt.room_type_id = ?
    `, [check_in, room_type_id]);

    if (roomTypes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room type not found'
      });
    }

    const roomType = roomTypes[0];

    // Check availability for all dates in the range
    const [availability] = await pool.execute(`
      SELECT MIN(qty) as min_available
      FROM RoomInventory
      WHERE room_type_id = ?
        AND stay_date >= ?
        AND stay_date < ?
    `, [room_type_id, check_in, check_out]);

    const minAvailable = availability[0]?.min_available || 0;
    const isAvailable = minAvailable > 0;

    // Calculate total amount
    const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalAmount = roomType.current_price * days;

    res.json({
      success: true,
      data: {
        room_type_id: parseInt(room_type_id),
        room_type_name: roomType.name,
        hotel_name: roomType.hotel_name,
        check_in,
        check_out,
        nights: days,
        available: isAvailable,
        available_count: minAvailable,
        price_per_night: parseFloat(roomType.current_price),
        total_amount: parseFloat(totalAmount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /roomtypes/:room_type_id/calendar - Get availability calendar
router.get('/:room_type_id/calendar', async (req, res) => {
  try {
    const { room_type_id } = req.params;
    const { start_date, end_date } = req.query;

    const startDate = start_date || new Date().toISOString().split('T')[0];
    const endDate = end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [calendar] = await pool.execute(`
      SELECT ri.stay_date, ri.qty as available_rooms,
             GetSeasonalPrice(ri.room_type_id, ri.stay_date) as price_per_night
      FROM RoomInventory ri
      WHERE ri.room_type_id = ?
        AND ri.stay_date >= ?
        AND ri.stay_date <= ?
      ORDER BY ri.stay_date
    `, [room_type_id, startDate, endDate]);

    res.json({
      success: true,
      data: {
        room_type_id: parseInt(room_type_id),
        calendar
      }
    });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;