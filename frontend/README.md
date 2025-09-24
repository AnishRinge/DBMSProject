# Travel Booking System - Frontend

A modern, responsive React application for the travel booking system with real backend integration and beautiful UI.

## 🚀 Features

### ✨ User Experience
- **Modern UI Design** - Clean, professional interface with Tailwind CSS
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Real-time Data** - Live integration with backend API (no hardcoded data)
- **Toast Notifications** - User-friendly feedback for all actions
- **Loading States** - Smooth loading indicators throughout the app

### 🔐 Authentication System
- **User Registration** - Create new accounts with validation
- **Secure Login** - JWT-based authentication with persistent sessions
- **Protected Routes** - Automatic redirection for authenticated content
- **User Profile** - Display logged-in user information

### 🏨 Hotel Browsing & Booking
- **City Exploration** - Browse hotels by city with real data from API
- **Hotel Details** - Comprehensive hotel information with reviews
- **Room Selection** - Choose from available room types with pricing
- **Smart Booking** - Date selection, guest count, real-time availability
- **Dynamic Pricing** - Seasonal pricing and total cost calculation

### 📋 Booking Management
- **Booking History** - View all past and current bookings
- **Booking Details** - Complete information for each reservation  
- **Cancellation** - Cancel confirmed bookings with confirmation
- **Status Tracking** - Visual status indicators (Confirmed, Cancelled, Pending)

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks and functional components
- **React Router v6** - Client-side routing with protected routes
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Axios** - HTTP client for API communication
- **Lucide React** - Beautiful, consistent icons
- **React Hot Toast** - Elegant toast notifications
- **Date-fns** - Date manipulation and formatting

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── components/             # Reusable React components
│   │   ├── Header.js          # Navigation header with auth
│   │   └── ProtectedRoute.js  # Route protection wrapper
│   ├── contexts/              # React Context providers
│   │   └── AuthContext.js     # Authentication state management
│   ├── pages/                 # Main page components
│   │   ├── Home.js           # Landing page with cities/hotels
│   │   ├── Login.js          # User login page
│   │   ├── Register.js       # User registration page
│   │   ├── CityHotels.js     # Hotels in selected city
│   │   ├── HotelDetails.js   # Hotel details and booking form
│   │   └── UserBookings.js   # User booking dashboard
│   ├── services/             # API service layer
│   │   ├── api.js           # Axios configuration and interceptors
│   │   └── index.js         # All API service functions
│   ├── App.js               # Main app component with routing
│   ├── index.js            # React app entry point
│   └── index.css           # Global styles and Tailwind imports
├── .env                    # Environment variables (local)
├── .env.example           # Environment template
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── postcss.config.js      # PostCSS configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Backend API running on port 3000
- MySQL database with sample data

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` if your backend runs on a different port:
   ```env
   REACT_APP_API_URL=http://localhost:3000/api
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Open in browser:**
   ```
   http://localhost:3001
   ```

## 🔧 API Integration

The frontend connects to your Node.js backend through a comprehensive service layer:

### Authentication Services
- `authService.register()` - User registration
- `authService.login()` - User login with JWT token storage
- `authService.logout()` - Clear session and redirect
- `authService.getCurrentUser()` - Get logged-in user info

### Hotel & City Services
- `cityService.getCities()` - Fetch all cities
- `cityService.getCityHotels(cityId)` - Hotels in specific city
- `hotelService.getHotelDetails(hotelId)` - Detailed hotel information
- `hotelService.searchHotels(params)` - Search functionality

### Booking Services
- `bookingService.createBooking(data)` - Create new booking
- `bookingService.getUserBookings()` - Fetch user's bookings
- `bookingService.cancelBooking(id)` - Cancel existing booking

### Room Services
- `roomService.checkAvailability()` - Real-time availability
- `roomService.getRoomPricing()` - Dynamic pricing calculation

## 🎨 UI Components & Features

### Homepage
- Hero section with search functionality
- City cards with click-to-explore
- Featured hotels carousel
- Responsive grid layouts

### Authentication Pages
- Elegant login/register forms with validation
- Password visibility toggles
- Demo credentials for testing
- Error handling with toast notifications

### Hotel Browsing
- City-based hotel listings
- Hotel cards with ratings and pricing
- Filter and search capabilities
- Smooth navigation between pages

### Booking Flow
- Interactive booking form with date pickers
- Real-time availability checking
- Dynamic price calculation with seasonal adjustments
- Guest count selection with room capacity limits
- Booking confirmation with total cost breakdown

### User Dashboard
- Complete booking history with status indicators
- Booking details with hotel information
- One-click booking cancellation
- Responsive table layout for all devices

## 🔒 Security Features

- JWT token automatic inclusion in API requests
- Token expiration handling with auto-logout
- Protected route redirection for unauthorized access
- Input validation and sanitization
- CORS handling for API communication

## 📱 Responsive Design

The frontend is fully responsive and optimized for:
- **Desktop** (1200px+) - Full-featured layout
- **Tablet** (768px-1199px) - Adapted grid layouts
- **Mobile** (320px-767px) - Mobile-first design

## 🧪 Testing & Development

### Available Scripts
```bash
npm start          # Start development server
npm run build      # Build production bundle
npm test           # Run test suite
npm run eject      # Eject from Create React App
```

### Development Features
- Hot module reloading for instant updates
- Environment-based API URL configuration
- Development vs production build optimization
- Source maps for debugging

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Environment Setup
Update `.env` for production:
```env
REACT_APP_API_URL=https://your-api-domain.com/api
GENERATE_SOURCEMAP=false
```

### Deployment Options
- **Netlify** - Connect GitHub repo for automatic deployments
- **Vercel** - Zero-configuration deployment platform
- **AWS S3 + CloudFront** - Scalable static hosting
- **Traditional Web Server** - Apache/Nginx with build files

## 🤝 Integration with Backend

The frontend is designed to work seamlessly with the provided Node.js backend:

1. **Automatic Authentication** - JWT tokens managed automatically
2. **Real-time Data** - All content loaded from your MySQL database
3. **Error Handling** - Graceful handling of API errors
4. **Loading States** - User feedback during API calls
5. **Route Matching** - Frontend routes align with API endpoints

## 🔧 Customization

### Styling
- Modify `tailwind.config.js` for custom colors/themes
- Update `src/index.css` for global style overrides
- Component-level styling in individual `.js` files

### API Configuration  
- Update `src/services/api.js` for API base URL changes
- Modify service functions in `src/services/index.js`
- Add new API endpoints as needed

### Features
- Add new pages in `src/pages/`
- Create reusable components in `src/components/`
- Extend authentication context for additional user features

## 🐛 Troubleshooting

### Common Issues

**Frontend won't start:**
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

**API connection errors:**
- Check backend is running on port 3000
- Verify REACT_APP_API_URL in `.env`
- Check browser console for CORS errors

**Authentication issues:**
- Clear localStorage: `localStorage.clear()`
- Check JWT token format in browser DevTools
- Verify backend JWT secret matches

**Styling issues:**
- Ensure Tailwind CSS is properly installed
- Check PostCSS configuration
- Verify import order in `index.css`

## 📊 Performance Features

- **Code Splitting** - Automatic route-based code splitting
- **Lazy Loading** - Components loaded on demand
- **Optimized Images** - Efficient image loading strategies
- **Caching** - API response caching for better performance
- **Minification** - Production builds are fully optimized

This frontend provides a complete, production-ready interface for your travel booking system with real backend integration and no placeholder data! 🎉