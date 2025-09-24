const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validatePayment = [
  body('booking_id').isInt({ min: 1 }).withMessage('Valid booking_id required'),
  body('payment_method').isIn(['CARD', 'UPI', 'NETBANKING', 'CASH']).withMessage('Valid payment method required'),
  body('card_number').optional().isCreditCard().withMessage('Valid card number required'),
  body('expiry').optional().matches(/^(0[1-9]|1[0-2])\/\d{2}$/).withMessage('Valid expiry format required (MM/YY)'),
  body('cvv').optional().isLength({ min: 3, max: 4 }).withMessage('Valid CVV required')
];

// POST /payments - Process payment for a booking
router.post('/', authenticateToken, validatePayment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { booking_id, payment_method, card_number, expiry, cvv } = req.body;
    const user_id = req.user.user_id;

    // Verify booking exists and belongs to user
    const [bookings] = await pool.execute(`
      SELECT b.booking_id, b.user_id, b.status, 
             p.status as payment_status,
             rt.name as room_type,
             h.name as hotel_name
      FROM Booking b
      LEFT JOIN Payment p ON b.booking_id = p.booking_id
      JOIN RoomType rt ON b.room_type_id = rt.room_type_id
      JOIN Hotel h ON rt.hotel_id = h.hotel_id
      WHERE b.booking_id = ?
    `, [booking_id]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    if (booking.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot pay for cancelled booking'
      });
    }

    if (booking.payment_status === 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking'
      });
    }

    // Get payment amount
    const [paymentInfo] = await pool.execute(`
      SELECT amount FROM Payment WHERE booking_id = ?
    `, [booking_id]);

    if (paymentInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    const amount = paymentInfo[0].amount;

    // Simulate payment processing
    const isPaymentSuccessful = simulatePaymentProcessing(payment_method, card_number);
    
    if (!isPaymentSuccessful) {
      // Update payment status to failed
      await pool.execute(`
        UPDATE Payment 
        SET status = 'FAILED', paid_at = NOW()
        WHERE booking_id = ?
      `, [booking_id]);

      return res.status(400).json({
        success: false,
        message: 'Payment processing failed. Please try again.'
      });
    }

    // Update payment status to success
    const [updateResult] = await pool.execute(`
      UPDATE Payment 
      SET status = 'SUCCESS', paid_at = NOW(), method = ?
      WHERE booking_id = ?
    `, [payment_method, booking_id]);

    // Generate transaction reference
    const transactionRef = `txn_${Date.now()}_${booking_id}`;

    // Get updated payment details
    const [updatedPayment] = await pool.execute(`
      SELECT payment_id, amount, status, paid_at
      FROM Payment 
      WHERE booking_id = ?
    `, [booking_id]);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment_id: updatedPayment[0].payment_id,
        booking_id: parseInt(booking_id),
        amount: parseFloat(updatedPayment[0].amount),
        status: updatedPayment[0].status,
        transaction_ref: transactionRef,
        paid_at: updatedPayment[0].paid_at,
        hotel_name: booking.hotel_name,
        room_type: booking.room_type
      }
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /payments/:payment_id - Get payment details
router.get('/:payment_id', authenticateToken, async (req, res) => {
  try {
    const { payment_id } = req.params;
    const user_id = req.user.user_id;
    const isAdmin = req.user.role === 'ADMIN';

    const [payments] = await pool.execute(`
      SELECT p.payment_id, p.booking_id, p.amount, p.method, p.status, p.paid_at,
             b.user_id, b.check_in, b.check_out,
             rt.name as room_type,
             h.name as hotel_name
      FROM Payment p
      JOIN Booking b ON p.booking_id = b.booking_id
      JOIN RoomType rt ON b.room_type_id = rt.room_type_id
      JOIN Hotel h ON rt.hotel_id = h.hotel_id
      WHERE p.payment_id = ?
    `, [payment_id]);

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = payments[0];

    // Check if user owns this payment or is admin
    if (payment.user_id !== user_id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /payments/:payment_id/refund - Process refund (Admin only)
router.post('/:payment_id/refund', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { payment_id } = req.params;
    const { reason } = req.body;

    const [payments] = await pool.execute(`
      SELECT p.payment_id, p.booking_id, p.status, p.amount,
             b.status as booking_status
      FROM Payment p
      JOIN Booking b ON p.booking_id = b.booking_id
      WHERE p.payment_id = ?
    `, [payment_id]);

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = payments[0];

    if (payment.status !== 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund successful payments'
      });
    }

    if (payment.status === 'REFUNDED') {
      return res.status(400).json({
        success: false,
        message: 'Payment already refunded'
      });
    }

    // Process refund
    await pool.execute(`
      UPDATE Payment 
      SET status = 'REFUNDED'
      WHERE payment_id = ?
    `, [payment_id]);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        payment_id: parseInt(payment_id),
        booking_id: payment.booking_id,
        refund_amount: parseFloat(payment.amount),
        reason: reason || 'Refund requested by admin'
      }
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Simulate payment processing (replace with actual payment gateway integration)
function simulatePaymentProcessing(paymentMethod, cardNumber) {
  // Simulate some basic validation
  if (paymentMethod === 'CARD') {
    // Simulate card validation
    if (!cardNumber || cardNumber.length < 15) {
      return false;
    }
    // Simulate a 5% failure rate
    return Math.random() > 0.05;
  }
  
  // Other payment methods have 2% failure rate
  return Math.random() > 0.02;
}

module.exports = router;