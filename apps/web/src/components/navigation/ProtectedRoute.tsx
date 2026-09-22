import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'ELDER' | 'CAREGIVER';
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user } = useAppContext();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'CAREGIVER' && user.role !== 'CAREGIVER') {
    return <Navigate to="/home" replace />;
  }

  if (role === 'ELDER' && user.role !== 'ELDER') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
