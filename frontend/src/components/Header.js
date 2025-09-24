import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Calendar, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Home className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">TravelBooker</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/hotels"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Hotels
            </Link>
            {isAuthenticated && (
              <Link
                to="/bookings"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
              >
                My Bookings
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="text-gray-700 font-medium hidden sm:block">
                    {user?.full_name}
                  </span>
                </div>
                <Link
                  to="/bookings"
                  className="btn-secondary flex items-center space-x-1"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:block">Bookings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-primary flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="btn-secondary">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;