
import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireRole = ({ children, roles }) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (!currentUser) {
    console.warn('RequireRole: No currentUser found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  const userRole = String(currentUser.role || '').toLowerCase();
  const allowedRoles = roles.map(r => String(r).toLowerCase());

  if (roles && !allowedRoles.includes(userRole)) {
    console.warn(`RequireRole: Role mismatch. User: ${userRole}, Allowed: ${allowedRoles}. Redirecting to dashboard.`);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RequireRole;
