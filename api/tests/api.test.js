const request = require('supertest');
const app = require('./app');

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  phone: '+1234567890'
};

const testAdmin = {
  name: 'Admin User',
  email: 'admin@test.com',
  password: 'adminpass123'
};

let userToken = '';
let adminToken = '';
let bookingId = '';
let paymentId = '';
let reviewId = '';

describe('Travel Booking API Tests', () => {
  
  // 🔑 Authentication Tests
  describe('Authentication', () => {
    
    test('Should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.email).toBe(testUser.email);
      userToken = response.body.data.token;
    });

    test('Should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      userToken = response.body.data.token;
    });

    test('Should reject login with invalid credentials', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);
    });

  });

  // 🌆 Cities & Hotels Tests
  describe('Cities and Hotels', () => {
    
    test('Should get all cities', async () => {
      const response = await request(app)
        .get('/api/v1/cities')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Should get hotels in a city', async () => {
      const response = await request(app)
        .get('/api/v1/cities/1/hotels')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Should get hotel details', async () => {
      const response = await request(app)
        .get('/api/v1/hotels/1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('hotel_id');
      expect(response.body.data).toHaveProperty('room_types');
    });

  });

  // 🛏 Room Availability Tests
  describe('Room Availability', () => {
    
    test('Should check room availability', async () => {
      const checkIn = '2025-12-01';
      const checkOut = '2025-12-03';
      
      const response = await request(app)
        .get(`/api/v1/roomtypes/1/availability?check_in=${checkIn}&check_out=${checkOut}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('available');
      expect(response.body.data).toHaveProperty('total_amount');
    });

    test('Should get availability calendar', async () => {
      const response = await request(app)
        .get('/api/v1/roomtypes/1/calendar')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('calendar');
      expect(Array.isArray(response.body.data.calendar)).toBe(true);
    });

  });

  // 📑 Booking Tests
  describe('Bookings', () => {
    
    test('Should create a new booking', async () => {
      const bookingData = {
        room_type_id: 1,
        check_in: '2025-12-01',
        check_out: '2025-12-03'
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('booking_id');
      bookingId = response.body.data.booking_id;
    });

    test('Should get booking details', async () => {
      const response = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking_id).toBe(bookingId);
    });

    test('Should get user bookings', async () => {
      const response = await request(app)
        .get('/api/v1/users/1/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('bookings');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });

    test('Should reject booking without authentication', async () => {
      const bookingData = {
        room_type_id: 1,
        check_in: '2025-12-01',
        check_out: '2025-12-03'
      };

      await request(app)
        .post('/api/v1/bookings')
        .send(bookingData)
        .expect(401);
    });

  });

  // 💳 Payment Tests
  describe('Payments', () => {
    
    test('Should process payment for booking', async () => {
      const paymentData = {
        booking_id: bookingId,
        payment_method: 'CARD',
        card_number: '4242424242424242',
        expiry: '12/25',
        cvv: '123'
      };

      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payment_id');
      expect(response.body.data.status).toBe('SUCCESS');
      paymentId = response.body.data.payment_id;
    });

    test('Should get payment details', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment_id).toBe(paymentId);
    });

  });

  // ⭐ Review Tests
  describe('Reviews', () => {
    
    test('Should add a review', async () => {
      const reviewData = {
        booking_id: bookingId,
        rating: 5,
        review_title: 'Amazing Experience!',
        review_text: 'The hotel was fantastic and the service was excellent.'
      };

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('review_id');
      reviewId = response.body.data.review_id;
    });

    test('Should get review details', async () => {
      const response = await request(app)
        .get(`/api/v1/reviews/${reviewId}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.review_id).toBe(reviewId);
    });

    test('Should mark review as helpful', async () => {
      const response = await request(app)
        .post(`/api/v1/reviews/${reviewId}/helpful`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    test('Should get recent reviews', async () => {
      const response = await request(app)
        .get('/api/v1/reviews/recent')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

  });

  // 💰 Seasonal Pricing Tests
  describe('Seasonal Pricing', () => {
    
    test('Should get seasonal pricing rules', async () => {
      const response = await request(app)
        .get('/api/v1/seasonal-pricing')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Should get current price for room type', async () => {
      const response = await request(app)
        .get('/api/v1/seasonal-pricing/room-types/1/current-price')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('current_price');
    });

  });

  // 🔍 Health Check Tests
  describe('Health Check', () => {
    
    test('Should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('timestamp');
    });

    test('Should return API documentation', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('documentation');
    });

  });

  // 🚨 Error Handling Tests
  describe('Error Handling', () => {
    
    test('Should return 404 for non-existent endpoint', async () => {
      await request(app)
        .get('/api/v1/non-existent')
        .expect(404);
    });

    test('Should return 400 for invalid booking data', async () => {
      const invalidData = {
        room_type_id: 'invalid',
        check_in: 'invalid-date'
      };

      await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    test('Should return 401 for expired/invalid token', async () => {
      await request(app)
        .get('/api/v1/bookings/1')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

  });

  // 🧹 Cleanup
  describe('Cleanup', () => {
    
    test('Should cancel booking', async () => {
      const response = await request(app)
        .put(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

  });

});

// Test configuration
beforeAll(async () => {
  // Wait for database connection
  await new Promise(resolve => setTimeout(resolve, 2000));
});

afterAll(async () => {
  // Close any open connections
  if (app.locals.db) {
    await app.locals.db.end();
  }
});