
import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireRole = ({ children, roles }) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireRole;
