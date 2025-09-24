import api from './api';

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const cityService = {
  // Get all cities
  getCities: async () => {
    const response = await api.get('/cities');
    return response.data.data;
  },

  // Get hotels in a city
  getCityHotels: async (cityId) => {
    const response = await api.get(`/cities/${cityId}/hotels`);
    return response.data.data;
  }
};

export const hotelService = {
  // Get all hotels
  getHotels: async () => {
    const response = await api.get('/hotels');
    return response.data.data;
  },

  // Get hotel details
  getHotelDetails: async (hotelId) => {
    const response = await api.get(`/hotels/${hotelId}`);
    return response.data.data;
  },

  // Search hotels
  searchHotels: async (params) => {
    const response = await api.get('/hotels/search', { params });
    return response.data.data;
  }
};

export const bookingService = {
  // Get user bookings
  getUserBookings: async () => {
    const response = await api.get('/bookings');
    return response.data.data;
  },

  // Create booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    const response = await api.post(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  // Get booking details
  getBookingDetails: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data.data;
  }
};

export const reviewService = {
  // Get hotel reviews
  getHotelReviews: async (hotelId) => {
    const response = await api.get(`/reviews/hotel/${hotelId}`);
    return response.data.data;
  },

  // Add review
  addReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Mark review as helpful
  markReviewHelpful: async (reviewId) => {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  }
};

export const roomService = {
  // Get room availability
  checkAvailability: async (roomTypeId, checkIn, checkOut) => {
    const response = await api.get(`/roomtypes/${roomTypeId}/availability`, {
      params: { check_in: checkIn, check_out: checkOut }
    });
    return response.data.data;
  },

  // Get room pricing
  getRoomPricing: async (roomTypeId, checkIn, checkOut) => {
    const response = await api.get(`/roomtypes/${roomTypeId}/pricing`, {
      params: { check_in: checkIn, check_out: checkOut }
    });
    return response.data.data;
  }
};