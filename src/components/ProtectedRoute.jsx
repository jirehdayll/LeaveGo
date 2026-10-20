import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_ROUTES } from '../constants';

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isActive, isAdmin, hasSession } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Validate session on component mount
    // This prevents flash of protected UI during initial auth check
    const validateSession = async () => {
      // Session validation is handled by useAuth hook
      // hasSession prop reflects current auth state
      setChecking(false);
    };

    validateSession();
  }, []);

  // Show loading spinner while checking session
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login with return path
  if (!user || !isActive || !hasSession) {
    const redirectTo = `${location.pathname}${location.search}`;
    return (
      <Navigate 
        to={`${APP_ROUTES.LOGIN}?redirectTo=${encodeURIComponent(redirectTo)}`} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Authenticated but insufficient permissions for admin route
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { user, loading, hasSession } = useAuth();
  if (!loading && hasSession && user?.role === 'penro') {
    return <Navigate to="/penro/dashboard" replace />;
  }
  return <ProtectedRoute requireAdmin>{children}</ProtectedRoute>;
}

export function PenroRoute({ children }) {
  const { user, loading, isActive, hasSession } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isActive || !hasSession) {
    const redirectTo = `${location.pathname}${location.search}`;
    return (
      <Navigate 
        to={`${APP_ROUTES.LOGIN}?redirectTo=${encodeURIComponent(redirectTo)}`} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  if (user.role !== 'penro' && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}