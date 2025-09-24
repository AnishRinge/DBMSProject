import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Building, Users, CreditCard } from 'lucide-react';
import { hotelService, bookingService, reviewService, roomService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, addDays, differenceInDays } from 'date-fns';

const HotelDetails = () => {
  const { hotelId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [hotel, setHotel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    room_type_id: '',
    check_in: format(new Date(), 'yyyy-MM-dd'),
    check_out: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    num_guests: 1
  });
  
  const [roomAvailability, setRoomAvailability] = useState({});
  const [roomPricing, setRoomPricing] = useState({});

  useEffect(() => {
    loadHotelDetails();
    loadHotelReviews();
  }, [hotelId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hotel && bookingForm.room_type_id && bookingForm.check_in && bookingForm.check_out) {
      checkRoomAvailability();
      getRoomPricing();
    }
  }, [bookingForm.room_type_id, bookingForm.check_in, bookingForm.check_out]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHotelDetails = async () => {
    try {
      setLoading(true);
      const hotelData = await hotelService.getHotelDetails(hotelId);
      setHotel(hotelData);
      
      // Set default room type
      if (hotelData.room_types && hotelData.room_types.length > 0) {
        setBookingForm(prev => ({
          ...prev,
          room_type_id: hotelData.room_types[0].room_type_id
        }));
      }
    } catch (error) {
      toast.error('Failed to load hotel details');
      console.error('Error loading hotel:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHotelReviews = async () => {
    try {
      const reviewsData = await reviewService.getHotelReviews(hotelId);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const checkRoomAvailability = async () => {
    try {
      const availability = await roomService.checkAvailability(
        bookingForm.room_type_id,
        bookingForm.check_in,
        bookingForm.check_out
      );
      setRoomAvailability(availability);
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const getRoomPricing = async () => {
    try {
      const pricing = await roomService.getRoomPricing(
        bookingForm.room_type_id,
        bookingForm.check_in,
        bookingForm.check_out
      );
      setRoomPricing(pricing);
    } catch (error) {
      console.error('Error getting pricing:', error);
    }
  };

  const handleBookingFormChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to make a booking');
      navigate('/login');
      return;
    }

    if (new Date(bookingForm.check_in) >= new Date(bookingForm.check_out)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    if (!roomAvailability.available) {
      toast.error('Selected room is not available for these dates');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        ...bookingForm,
        hotel_id: parseInt(hotelId),
        room_type_id: parseInt(bookingForm.room_type_id),
        num_guests: parseInt(bookingForm.num_guests)
      };

      await bookingService.createBooking(bookingData);
      toast.success('Booking created successfully!');
      navigate('/bookings');
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setBookingLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!roomPricing.total_price) return 0;
    const nights = differenceInDays(new Date(bookingForm.check_out), new Date(bookingForm.check_in));
    return roomPricing.total_price * nights;
  };

  const getSelectedRoomType = () => {
    if (!hotel || !hotel.room_types) return null;
    return hotel.room_types.find(rt => rt.room_type_id === parseInt(bookingForm.room_type_id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Hotel not found</h3>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </Link>
            <span className="text-gray-400">/</span>
            <h1 className="text-2xl font-bold text-gray-900">{hotel.name}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hotel Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hotel Info */}
            <div className="card p-6">
              <div className="h-64 bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg mb-6 flex items-center justify-center">
                <Building className="h-24 w-24 text-white opacity-80" />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900">{hotel.name}</h2>
                <div className="flex items-center space-x-1">
                  <Star className="h-6 w-6 text-yellow-400 fill-current" />
                  <span className="text-lg font-medium text-gray-600">{hotel.rating}</span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600 mb-6">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{hotel.address}</span>
              </div>
              
              <p className="text-gray-600">
                Located in {hotel.city_name}, {hotel.country}, this hotel offers excellent 
                accommodation with modern amenities and outstanding service.
              </p>
            </div>

            {/* Room Types */}
            <div className="card p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Available Rooms</h3>
              {hotel.room_types && hotel.room_types.length > 0 ? (
                <div className="space-y-4">
                  {hotel.room_types.map((roomType) => (
                    <div key={roomType.room_type_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{roomType.name}</h4>
                          <div className="flex items-center space-x-4 text-gray-600 mt-2">
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>Max {roomType.max_guests} guests</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">₹{roomType.base_price}</p>
                          <p className="text-sm text-gray-500">per night</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No rooms available</p>
              )}
            </div>

            {/* Reviews */}
            <div className="card p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Guest Reviews</h3>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.review_id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-gray-600 ml-2">
                            by {review.user_name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{review.review_title}</h4>
                      <p className="text-gray-600">{review.review_text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No reviews yet</p>
              )}
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Book Your Stay</h3>
              
              <form onSubmit={handleBooking} className="space-y-4">
                {/* Room Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type
                  </label>
                  <select
                    name="room_type_id"
                    value={bookingForm.room_type_id}
                    onChange={handleBookingFormChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Room Type</option>
                    {hotel.room_types?.map((roomType) => (
                      <option key={roomType.room_type_id} value={roomType.room_type_id}>
                        {roomType.name} - ₹{roomType.base_price}/night
                      </option>
                    ))}
                  </select>
                </div>

                {/* Check-in Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    name="check_in"
                    value={bookingForm.check_in}
                    onChange={handleBookingFormChange}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="input-field"
                    required
                  />
                </div>

                {/* Check-out Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    name="check_out"
                    value={bookingForm.check_out}
                    onChange={handleBookingFormChange}
                    min={bookingForm.check_in}
                    className="input-field"
                    required
                  />
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests
                  </label>
                  <select
                    name="num_guests"
                    value={bookingForm.num_guests}
                    onChange={handleBookingFormChange}
                    className="input-field"
                    required
                  >
                    {[...Array(getSelectedRoomType()?.max_guests || 4)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} Guest{i + 1 !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability Status */}
                {roomAvailability && (
                  <div className={`p-3 rounded-lg ${
                    roomAvailability.available 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      roomAvailability.available ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {roomAvailability.available 
                        ? `✓ Available (${roomAvailability.available_rooms} rooms left)`
                        : '✗ Not available for selected dates'
                      }
                    </p>
                  </div>
                )}

                {/* Pricing */}
                {roomPricing.total_price && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Price per night:</span>
                      <span className="font-medium">₹{roomPricing.base_price}</span>
                    </div>
                    {roomPricing.seasonal_multiplier !== 1 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Seasonal adjustment:</span>
                        <span className="font-medium">×{roomPricing.seasonal_multiplier}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">
                        {differenceInDays(new Date(bookingForm.check_out), new Date(bookingForm.check_in))} nights:
                      </span>
                      <span className="font-medium">₹{roomPricing.total_price}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-primary-600">
                        ₹{calculateTotalPrice()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Book Button */}
                <button
                  type="submit"
                  disabled={bookingLoading || !roomAvailability.available || !isAuthenticated}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>
                    {bookingLoading 
                      ? 'Booking...' 
                      : !isAuthenticated 
                      ? 'Login to Book' 
                      : 'Book Now'
                    }
                  </span>
                </button>

                {!isAuthenticated && (
                  <p className="text-center text-sm text-gray-500">
                    <Link to="/login" className="text-primary-600 hover:underline">
                      Sign in
                    </Link> to make a booking
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetails;