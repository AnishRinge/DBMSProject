# Travel Booking System - Backend API

A comprehensive RESTful API for a travel booking system built with Node.js, Express, and MySQL.

## 🚀 Features

- **User Authentication** - JWT-based auth with role-based access (Customer/Admin)
- **City Management** - CRUD operations for cities
- **Hotel Management** - Hotel listings with ratings and locations  
- **Room Booking** - Real-time availability and booking system
- **Review System** - User reviews with helpfulness voting
- **Seasonal Pricing** - Dynamic pricing based on seasons and demand
- **Payment Processing** - Booking payments and tracking

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL 8.0+
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: bcryptjs, CORS, Rate limiting
- **Testing**: Jest, Supertest

## 📋 Prerequisites

- Node.js 16+ 
- MySQL 8.0+
- npm or yarn

## 🛠 Installation

1. **Navigate to the backend directory:**
   ```bash
   cd DBMSProject/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and configuration.

4. **Database setup:**
   - Create the `travel_booking` database
   - Run the SQL scripts in order:
     ```bash
     mysql -u root -p travel_booking < ../create\ tables.txt
     mysql -u root -p travel_booking < ../seed\ sample\ data.txt
     mysql -u root -p travel_booking < ../review_and_pricing_procedures.txt
     ```

5. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

Access the interactive API documentation at: `http://localhost:3000/api/v1`

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Core Endpoints

#### 🔑 Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout

#### 🌆 Cities & Hotels
- `GET /api/v1/cities` - List all cities
- `GET /api/v1/cities/:city_id/hotels` - Hotels in a city
- `GET /api/v1/hotels/:hotel_id` - Hotel details with room types
- `GET /api/v1/hotels/:hotel_id/reviews` - Hotel reviews

#### 🛏 Room Management
- `GET /api/v1/roomtypes/:room_type_id/availability` - Check availability
- `GET /api/v1/roomtypes/:room_type_id/calendar` - Availability calendar

#### 📑 Bookings
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings/:booking_id` - Booking details
- `PUT /api/v1/bookings/:booking_id/cancel` - Cancel booking
- `GET /api/v1/users/:user_id/bookings` - User's bookings

#### 💳 Payments
- `POST /api/v1/payments` - Process payment
- `GET /api/v1/payments/:payment_id` - Payment details
- `POST /api/v1/payments/:payment_id/refund` - Process refund (Admin)

#### ⭐ Reviews
- `POST /api/v1/reviews` - Add review
- `GET /api/v1/reviews/:review_id` - Get review
- `PUT /api/v1/reviews/:review_id` - Update review
- `DELETE /api/v1/reviews/:review_id` - Delete review
- `POST /api/v1/reviews/:review_id/helpful` - Mark helpful
- `GET /api/v1/reviews/recent` - Recent reviews

#### 💰 Seasonal Pricing
- `GET /api/v1/seasonal-pricing` - List pricing rules
- `POST /api/v1/seasonal-pricing` - Create pricing rule (Admin)
- `GET /api/v1/seasonal-pricing/:pricing_id` - Get pricing rule
- `PUT /api/v1/seasonal-pricing/:pricing_id` - Update rule (Admin)
- `DELETE /api/v1/seasonal-pricing/:pricing_id` - Delete rule (Admin)
- `GET /api/v1/seasonal-pricing/room-types/:room_type_id/current-price` - Current price

## 🔧 Usage Examples

### Register & Login
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com", 
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Check Availability & Book
```bash
# Check availability
curl "http://localhost:3000/api/v1/roomtypes/1/availability?check_in=2025-10-01&check_out=2025-10-03"

# Create booking
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "room_type_id": 1,
    "check_in": "2025-10-01",
    "check_out": "2025-10-03"
  }'
```

### Process Payment
```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "payment_method": "CARD",
    "card_number": "4242424242424242",
    "expiry": "12/25",
    "cvv": "123"
  }'
```

### Add Review
```bash
curl -X POST http://localhost:3000/api/v1/reviews \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "rating": 5,
    "review_title": "Excellent Stay!",
    "review_text": "Amazing hotel with great service and beautiful rooms."
  }'
```

## 🏗 Architecture

### Project Structure
```
api/
├── config/
│   └── database.js          # MySQL connection setup
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── cities.js            # Cities and hotels
│   ├── hotels.js            # Hotel details and reviews
│   ├── roomtypes.js         # Room availability
│   ├── bookings.js          # Booking management
│   ├── payments.js          # Payment processing
│   ├── reviews.js           # Review system
│   └── seasonal-pricing.js  # Dynamic pricing
├── .env.example             # Environment template
├── app.js                   # Main application
├── package.json             # Dependencies
└── README.md               # This file
```

### Security Features
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Express-validator for all inputs
- **Rate Limiting** - Protection against abuse
- **CORS Configuration** - Cross-origin resource sharing
- **Helmet.js** - Security headers
- **SQL Injection Protection** - Parameterized queries

### Database Integration
- **Connection Pooling** - Efficient database connections
- **Stored Procedures** - Complex business logic in MySQL
- **Transaction Management** - ACID compliance for bookings
- **Inventory Locking** - Prevents overbooking

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [/* Validation errors array */]
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 🔧 Development

### Environment Variables
```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=travel_booking
JWT_SECRET=your_secret_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Scripts
- `npm start` - Production server
- `npm run dev` - Development with nodemon
- `npm test` - Run tests (when implemented)

### Database Functions
The API leverages MySQL stored procedures and functions:
- `MakeBooking()` - Handles booking creation with inventory management
- `CancelBooking()` - Cancellation with inventory restoration
- `GetSeasonalPrice()` - Dynamic pricing calculation
- `AddReview()` - Review creation with validation

## 🎯 Future Enhancements

- **Real Payment Gateway** - Integrate Stripe/Razorpay
- **Email Notifications** - Booking confirmations
- **File Uploads** - Hotel images and user avatars
- **Search & Filters** - Advanced hotel search
- **Caching** - Redis for performance
- **Testing** - Comprehensive test suite
- **Documentation** - Swagger/OpenAPI integration

## 📄 License

MIT License - feel free to use this project for learning and development.

---

For questions or issues, please refer to the API documentation at `/api/v1` when the server is running.