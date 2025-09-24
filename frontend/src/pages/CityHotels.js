import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Building, Users } from 'lucide-react';
import { cityService } from '../services';
import toast from 'react-hot-toast';

const CityHotels = () => {
  const { cityId } = useParams();
  const [hotels, setHotels] = useState([]);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCityHotels();
  }, [cityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCityHotels = async () => {
    try {
      setLoading(true);
      const hotelsData = await cityService.getCityHotels(cityId);
      setHotels(hotelsData);
      
      // Set city name from first hotel
      if (hotelsData.length > 0) {
        setCity({
          name: hotelsData[0].city_name,
          country: hotelsData[0].country
        });
      }
    } catch (error) {
      toast.error('Failed to load hotels');
      console.error('Error loading city hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHotelClick = (hotelId) => {
    navigate(`/hotel/${hotelId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
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
              <span>Back to Home</span>
            </Link>
            {city && (
              <>
                <span className="text-gray-400">/</span>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary-600" />
                  <h1 className="text-2xl font-bold text-gray-900">
                    {city.name}, {city.country}
                  </h1>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hotels List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hotels.length === 0 ? (
          <div className="text-center py-16">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hotels found
            </h3>
            <p className="text-gray-500">
              There are no hotels available in this city at the moment.
            </p>
            <Link to="/" className="btn-primary mt-6">
              Explore Other Cities
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Hotels in {city?.name}
              </h2>
              <p className="text-gray-600">
                {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hotels.map((hotel) => (
                <div
                  key={hotel.hotel_id}
                  onClick={() => handleHotelClick(hotel.hotel_id)}
                  className="card cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  {/* Hotel Image Placeholder */}
                  <div className="h-48 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                    <Building className="h-16 w-16 text-white opacity-80" />
                  </div>

                  {/* Hotel Details */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-600">
                          {hotel.rating}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">{hotel.address}</span>
                    </div>

                    {hotel.room_types && hotel.room_types.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Available Rooms:</p>
                        <div className="space-y-2">
                          {hotel.room_types.slice(0, 2).map((roomType, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700">{roomType.name}</span>
                              </div>
                              <span className="font-medium text-primary-600">
                                ₹{roomType.base_price}
                              </span>
                            </div>
                          ))}
                          {hotel.room_types.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{hotel.room_types.length - 2} more room types
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <button className="w-full btn-primary">
                      View Details & Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CityHotels;