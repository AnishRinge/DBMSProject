import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, MapPin, Star, X, Eye } from 'lucide-react';
import { bookingService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadUserBookings();
  }, []);

  const loadUserBookings = async () => {
    try {
      setLoading(true);
      const bookingsData = await bookingService.getUserBookings();
      setBookings(bookingsData);
    } catch (error) {
      toast.error('Failed to load bookings');
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancellingBooking(bookingId);
    try {
      await bookingService.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      loadUserBookings(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setCancellingBooking(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.full_name}! Here are your travel bookings.
          </p>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start exploring and book your perfect stay!
            </p>
            <a href="/" className="btn-primary">
              Browse Hotels
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.booking_id} className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.hotel_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.city_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(booking.check_in), 'MMM dd, yyyy')} - 
                          {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>₹{booking.total_amount}</span>
                      </div>
                      <div>
                        <span className="font-medium">{booking.room_type_name}</span>
                        <span className="text-gray-500"> • {booking.num_guests} guests</span>
                      </div>
                    </div>

                    {booking.hotel_rating && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{booking.hotel_rating} rating</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex space-x-3">
                    <button
                      onClick={() => {/* View details logic */}}
                      className="btn-secondary flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    
                    {booking.status.toLowerCase() === 'confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(booking.booking_id)}
                        disabled={cancellingBooking === booking.booking_id}
                        className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center space-x-1"
                      >
                        <X className="h-4 w-4" />
                        <span>
                          {cancellingBooking === booking.booking_id ? 'Cancelling...' : 'Cancel'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Booking ID: {booking.booking_id}</span>
                    <span>
                      Booked on {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBookings;