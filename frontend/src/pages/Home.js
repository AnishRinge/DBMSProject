import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Star, Building } from 'lucide-react';
import { cityService, hotelService } from '../services';
import toast from 'react-hot-toast';

const Home = () => {
  const [cities, setCities] = useState([]);
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [citiesData, hotelsData] = await Promise.all([
        cityService.getCities(),
        hotelService.getHotels()
      ]);
      setCities(citiesData);
      setFeaturedHotels(hotelsData.slice(0, 6)); // Show top 6 hotels
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCityClick = (cityId) => {
    navigate(`/city/${cityId}/hotels`);
  };

  const handleHotelClick = (hotelId) => {
    navigate(`/hotel/${hotelId}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/hotels?search=${encodeURIComponent(searchQuery.trim())}`);
    }
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
      {/* Hero Section */}
      <section className="relative gradient-bg text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Discover amazing hotels and create unforgettable memories
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex rounded-full bg-white p-2 shadow-lg">
              <input
                type="text"
                placeholder="Search cities, hotels, destinations..."
                className="flex-1 px-6 py-3 text-gray-900 bg-transparent outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-full flex items-center space-x-2 transition-colors duration-200"
              >
                <Search className="h-5 w-5" />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Popular Destinations
            </h2>
            <p className="text-xl text-gray-600">
              Choose from our top destinations and start your journey
            </p>
          </div>

          {cities.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No cities available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cities.map((city) => (
                <div
                  key={city.city_id}
                  onClick={() => handleCityClick(city.city_id)}
                  className="card p-6 cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {city.name}
                      </h3>
                      <p className="text-gray-600">{city.country}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Hotels
            </h2>
            <p className="text-xl text-gray-600">
              Handpicked accommodations for an exceptional experience
            </p>
          </div>

          {featuredHotels.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hotels available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredHotels.map((hotel) => (
                <div
                  key={hotel.hotel_id}
                  onClick={() => handleHotelClick(hotel.hotel_id)}
                  className="card cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="h-48 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                    <Building className="h-16 w-16 text-white opacity-80" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
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
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{hotel.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {hotel.city_name}, {hotel.country}
                      </span>
                      <button className="btn-primary text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;