import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  
  // Development mode flag - set to true to bypass authentication
  const isDevelopmentMode = true;

  // If still loading auth state, show nothing (or a spinner if preferred)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no user is authenticated and not in development mode, redirect to login
  if (!currentUser && !isDevelopmentMode) {
    return <Navigate to="/login" replace />;
  }

  // Render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
