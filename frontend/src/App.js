import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CityHotels from './pages/CityHotels';
import HotelDetails from './pages/HotelDetails';
import UserBookings from './pages/UserBookings';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/city/:cityId/hotels" element={<CityHotels />} />
              <Route path="/hotel/:hotelId" element={<HotelDetails />} />
              
              {/* Protected Routes */}
              <Route 
                path="/bookings" 
                element={
                  <ProtectedRoute>
                    <UserBookings />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all route */}
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-gray-600 mb-8">Page not found</p>
                      <a href="/" className="btn-primary">Go Home</a>
                    </div>
                  </div>
                } 
              />
            </Routes>
          </main>
          
          {/* Toast Notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4ade80',
                },
              },
              error: {
                duration: 4000,
                theme: {
                  primary: '#f87171',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;