const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateBooking = [
  body('room_type_id').isInt({ min: 1 }).withMessage('Valid room_type_id required'),
  body('check_in').isDate().withMessage('Valid check_in date required (YYYY-MM-DD)'),
  body('check_out').isDate().withMessage('Valid check_out date required (YYYY-MM-DD)')
];

// POST /bookings - Create a new booking
router.post('/', authenticateToken, validateBooking, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { room_type_id, check_in, check_out } = req.body;
    const user_id = req.user.user_id;

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

    // Calculate total amount with seasonal pricing
    const [priceInfo] = await pool.execute(`
      SELECT GetSeasonalPrice(?, ?) as price_per_night
    `, [room_type_id, check_in]);

    const pricePerNight = priceInfo[0]?.price_per_night || 0;
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalAmount = pricePerNight * nights;

    // Create booking using stored procedure
    await pool.execute(`
      CALL MakeBooking(?, ?, ?, ?, ?, ?)
    `, [user_id, room_type_id, check_in, check_out, totalAmount, 'CARD']);

    // Get the created booking details
    const [bookingResult] = await pool.execute(`
      SELECT b.booking_id, b.status, b.created_at,
             rt.name as room_type_name,
             h.name as hotel_name,
             p.amount as total_amount
      FROM Booking b
      JOIN RoomType rt ON b.room_type_id = rt.room_type_id
      JOIN Hotel h ON rt.hotel_id = h.hotel_id
      LEFT JOIN Payment p ON b.booking_id = p.booking_id
      WHERE b.user_id = ? AND b.room_type_id = ? AND b.check_in = ?
      ORDER BY b.created_at DESC
      LIMIT 1
    `, [user_id, room_type_id, check_in]);

    if (bookingResult.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Booking creation failed'
      });
    }

    const booking = bookingResult[0];

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking_id: booking.booking_id,
        status: booking.status,
        total_amount: parseFloat(booking.total_amount),
        hotel_name: booking.hotel_name,
        room_type: booking.room_type_name,
        check_in,
        check_out,
        nights
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    
    // Handle specific database errors
    if (error.message.includes('Insufficient inventory')) {
      return res.status(409).json({
        success: false,
        message: 'Selected dates are not available'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /bookings/:booking_id - Get booking details
router.get('/:booking_id', authenticateToken, async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.user_id;
    const isAdmin = req.user.role === 'ADMIN';

    const [bookings] = await pool.execute(`
      SELECT b.booking_id, b.user_id, b.check_in, b.check_out, b.status, b.created_at,
             rt.name as room_type, rt.max_guests,
             h.name as hotel, h.address, h.rating,
             c.name as city, c.country,
             p.amount as total_amount, p.method as payment_method, p.status as payment_status,
             u.full_name as guest_name, u.email as guest_email
      FROM Booking b
      JOIN RoomType rt ON b.room_type_id = rt.room_type_id
      JOIN Hotel h ON rt.hotel_id = h.hotel_id
      JOIN City c ON h.city_id = c.city_id
      LEFT JOIN Payment p ON b.booking_id = p.booking_id
      JOIN \`User\` u ON b.user_id = u.user_id
      WHERE b.booking_id = ?
    `, [booking_id]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    // Check if user owns this booking or is admin
    if (booking.user_id !== user_id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /bookings/:booking_id/cancel - Cancel a booking
router.put('/:booking_id/cancel', authenticateToken, async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.user_id;
    const isAdmin = req.user.role === 'ADMIN';

    // Verify booking ownership
    const [bookingCheck] = await pool.execute(`
      SELECT user_id, status FROM Booking WHERE booking_id = ?
    `, [booking_id]);

    if (bookingCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookingCheck[0];

    if (booking.user_id !== user_id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Cancel booking using stored procedure
    await pool.execute('CALL CancelBooking(?)', [booking_id]);

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    
    if (error.message.includes('already cancelled')) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /users/:user_id/bookings - Get user's bookings
router.get('/users/:user_id/bookings', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const requestingUserId = req.user.user_id;
    const isAdmin = req.user.role === 'ADMIN';

    // Check if user can access these bookings
    if (parseInt(user_id) !== requestingUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.booking_id, b.check_in, b.check_out, b.status, b.created_at,
             rt.name as room_type,
             h.name as hotel, h.rating,
             c.name as city,
             p.amount as total_amount, p.status as payment_status
      FROM Booking b
      JOIN RoomType rt ON b.room_type_id = rt.room_type_id
      JOIN Hotel h ON rt.hotel_id = h.hotel_id
      JOIN City c ON h.city_id = c.city_id
      LEFT JOIN Payment p ON b.booking_id = p.booking_id
      WHERE b.user_id = ?
    `;

    const params = [user_id];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status.toUpperCase());
    }

    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [bookings] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM Booking WHERE user_id = ?';
    const countParams = [user_id];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status.toUpperCase());
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;