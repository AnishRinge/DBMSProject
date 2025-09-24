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

Before running this project, make sure you have:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (8.0 or higher) - Options:
  - [XAMPP](https://www.apachefriends.org/) (Recommended for Windows)
  - [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
  - [WAMP](https://www.wampserver.com/) (Windows)
- **Postman** (for API testing) - [Download here](https://www.postman.com/)

## 🔧 Local Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd DBMSProject
```

### 2. Install Dependencies
```bash
cd api
npm install
```

### 3. Database Setup

#### Option A: Using XAMPP (Recommended)
1. **Install XAMPP** from https://www.apachefriends.org/
2. **Start Apache and MySQL** from XAMPP Control Panel
3. **Open phpMyAdmin** at http://localhost/phpmyadmin
4. **Create Database**:
   - Click "New" in the left sidebar
   - Database name: `travel_booking`
   - Click "Create"
5. **Create Tables**:
   - Select the `travel_booking` database
   - Go to "SQL" tab
   - Copy and paste the content from `create tables.txt`
   - Click "Go"
6. **Insert Sample Data**:
   - Go to "SQL" tab again  
   - Copy and paste the content from `seed sample data.txt`
   - Click "Go"

#### Option B: Using MySQL Command Line
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE travel_booking;"

# Run table creation script
mysql -u root -p travel_booking < "create tables.txt"

# Run sample data script  
mysql -u root -p travel_booking < "seed sample data.txt"
```

### 4. Environment Configuration

Create a `.env` file in the `api` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=travel_booking
DB_PORT=3306

# JWT Configuration  
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ Important**: 
- If you set a password for MySQL root user, update `DB_PASSWORD`
- Change `JWT_SECRET` to a secure random string
- For XAMPP, usually no password is needed for root user

### 5. Start the Server
```bash
npm start
```

You should see:
```
🚀 Server is running on port 3000
✅ Database connected successfully
📊 Connected to: travel_booking on localhost:3306
```

### 6. Test the API

#### Basic Health Check
Open your browser or Postman and test:
```
GET http://localhost:3000/api/cities
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "city_id": 1,
      "name": "Mumbai",
      "country": "India"
    },
    {
      "city_id": 2,  
      "name": "Delhi",
      "country": "India"
    },
    {
      "city_id": 3,
      "name": "Goa", 
      "country": "India"
    }
  ]
}
```

## 🧪 API Testing

### Method 1: Using Postman

1. **Import Collection**: Import `api-tests.postman_collection.json`
2. **Set Environment Variables**:
   - `baseUrl`: `http://localhost:3000`
3. **Test Endpoints**: Start with Authentication → Cities → Hotels → Bookings

### Method 2: Using Jest Tests
```bash
npm test
```

### Method 3: Manual Testing with curl

#### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com", 
    "password": "password123",
    "phone": "+91-9876543210"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📚 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **Authentication** |
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| **Cities** |
| GET | `/api/cities` | Get all cities | No |
| POST | `/api/cities` | Add new city | Admin |
| **Hotels** |
| GET | `/api/hotels` | Get hotels | No |
| GET | `/api/hotels/city/:cityId` | Get hotels by city | No |
| POST | `/api/hotels` | Add new hotel | Admin |
| **Bookings** |
| GET | `/api/bookings` | Get user bookings | Yes |
| POST | `/api/bookings` | Create booking | Yes |
| POST | `/api/bookings/:id/cancel` | Cancel booking | Yes |
| **Reviews** |
| GET | `/api/reviews/hotel/:hotelId` | Get hotel reviews | No |
| POST | `/api/reviews` | Add review | Yes |
| POST | `/api/reviews/:id/helpful` | Mark helpful | Yes |

## 🐛 Troubleshooting

### Database Connection Issues
- **Error 1045**: Wrong password
  - Check your MySQL password in `.env` file
- **Error 2002**: MySQL not running
  - Start MySQL from XAMPP Control Panel
- **Database doesn't exist**: 
  - Create `travel_booking` database in phpMyAdmin

### API Issues  
- **Empty responses**: Database might be empty
  - Run the seed data script again
- **Port 3000 already in use**:
  - Change `PORT=3001` in `.env` file
- **JWT errors**: 
  - Make sure `JWT_SECRET` is set in `.env`

### Common Solutions
```bash
# Reset database (if needed)
# In phpMyAdmin: Drop travel_booking database, recreate it, and run scripts again

# Clear npm cache (if installation fails)
npm cache clean --force
npm install

# Check if all dependencies installed
npm list
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Need help?** Check the troubleshooting section or create an issue in the repository.