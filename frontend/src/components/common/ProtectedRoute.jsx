import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-mono animate-pulse">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to login page, remembering location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
