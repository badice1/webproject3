import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  role?: 'member' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && profile) {
    if (role === 'admin' && profile.role !== 'admin') {
       return <Navigate to="/member" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
