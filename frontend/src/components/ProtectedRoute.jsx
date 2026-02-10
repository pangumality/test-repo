import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    console.log('ProtectedRoute check:', { token: token ? 'Present' : 'Missing' });
    setIsAuthenticated(!!token);
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
