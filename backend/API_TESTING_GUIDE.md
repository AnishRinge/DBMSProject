# Travel Booking API - Manual Testing Guide

## 🚀 **Getting Started**

1. Start your API server:
   ```bash
   npm start
   ```

2. API should be running on: `http://localhost:3000`

3. Use tools like:
   - **Postman** (recommended)
   - **Thunder Client** (VS Code extension)
   - **curl** (command line)
   - **Browser** (for GET requests)

---

## 🔑 **1. Authentication Endpoints**

### **Register New User**
```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **Login User**
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🌆 **2. Cities & Hotels**

### **Get All Cities**
```http
GET http://localhost:3000/api/v1/cities
```

### **Get Hotels in a City**
```http
GET http://localhost:3000/api/v1/cities/1/hotels
```

### **Get Hotel Details**
```http
GET http://localhost:3000/api/v1/hotels/1
```

### **Get Hotel Reviews**
```http
GET http://localhost:3000/api/v1/hotels/1/reviews
```

---

## 🛏 **3. Room Availability**

### **Check Room Availability**
```http
GET http://localhost:3000/api/v1/roomtypes/1/availability?check_in=2025-12-01&check_out=2025-12-03
```

### **Get Availability Calendar**
```http
GET http://localhost:3000/api/v1/roomtypes/1/calendar?start_date=2025-12-01&end_date=2025-12-31
```

---

## 📑 **4. Bookings (Requires Authentication)**

⚠️ **Important: Add Authorization header for all booking endpoints**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

### **Create Booking**
```http
POST http://localhost:3000/api/v1/bookings
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "room_type_id": 1,
  "check_in": "2025-12-01",
  "check_out": "2025-12-03"
}
```

### **Get Booking Details**
```http
GET http://localhost:3000/api/v1/bookings/1
Authorization: Bearer YOUR_JWT_TOKEN
```

### **Get User's Bookings**
```http
GET http://localhost:3000/api/v1/users/1/bookings
Authorization: Bearer YOUR_JWT_TOKEN
```

### **Cancel Booking**
```http
PUT http://localhost:3000/api/v1/bookings/1/cancel
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 💳 **5. Payments (Requires Authentication)**

### **Process Payment**
```http
POST http://localhost:3000/api/v1/payments
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "booking_id": 1,
  "payment_method": "CARD",
  "card_number": "4242424242424242",
  "expiry": "12/25",
  "cvv": "123"
}
```

### **Get Payment Details**
```http
GET http://localhost:3000/api/v1/payments/1
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## ⭐ **6. Reviews (Requires Authentication)**

### **Add Review**
```http
POST http://localhost:3000/api/v1/reviews
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "booking_id": 1,
  "rating": 5,
  "review_title": "Amazing Stay!",
  "review_text": "The hotel exceeded all expectations. Great service and beautiful rooms."
}
```

### **Get Specific Review**
```http
GET http://localhost:3000/api/v1/reviews/1
```

### **Mark Review as Helpful**
```http
POST http://localhost:3000/api/v1/reviews/1/helpful
Authorization: Bearer YOUR_JWT_TOKEN
```

### **Update Review**
```http
PUT http://localhost:3000/api/v1/reviews/1
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "booking_id": 1,
  "rating": 4,
  "review_title": "Good Stay",
  "review_text": "Updated review text here."
}
```

### **Get Recent Reviews**
```http
GET http://localhost:3000/api/v1/reviews/recent?limit=10
```

---

## 💰 **7. Seasonal Pricing (Admin Only)**

⚠️ **Requires Admin Token**

### **Get Seasonal Pricing Rules**
```http
GET http://localhost:3000/api/v1/seasonal-pricing
```

### **Get Current Price for Room Type**
```http
GET http://localhost:3000/api/v1/seasonal-pricing/room-types/1/current-price?date=2025-12-25
```

### **Create Pricing Rule (Admin Only)**
```http
POST http://localhost:3000/api/v1/seasonal-pricing
Content-Type: application/json
Authorization: Bearer ADMIN_JWT_TOKEN

{
  "room_type_id": 1,
  "season_name": "Christmas Special",
  "description": "Christmas and New Year premium pricing",
  "start_date": "2025-12-20",
  "end_date": "2026-01-05",
  "price_multiplier": 1.8,
  "priority": 5
}
```

---

## 🔍 **8. Health Check & Documentation**

### **Health Check**
```http
GET http://localhost:3000/health
```

### **API Documentation**
```http
GET http://localhost:3000/api/v1
```

---

## 📝 **Testing Flow Example**

1. **Register** a new user → Get JWT token
2. **Login** with credentials → Verify token works
3. **Browse cities** and hotels
4. **Check availability** for specific dates
5. **Create booking** → Note booking_id
6. **Process payment** for the booking
7. **Add review** for the booking
8. **Test seasonal pricing** features

---

## 🚨 **Common Issues & Solutions**

### **401 Unauthorized**
- Check if JWT token is included in Authorization header
- Token format: `Bearer YOUR_TOKEN_HERE`

### **Database Errors**
- Ensure XAMPP MySQL is running
- Check if all tables are created
- Verify seed data is inserted

### **Validation Errors**
- Check request body format
- Ensure all required fields are included
- Verify data types (dates, numbers, etc.)

---

## 🎯 **Success Criteria**

✅ All endpoints return expected responses
✅ Authentication works correctly
✅ Booking flow completes successfully
✅ Reviews can be added and retrieved
✅ Seasonal pricing calculates correctly
✅ Error handling works properly