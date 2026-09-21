import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireApproval?: boolean;
  requireAdmin?: boolean;
  requireFaculty?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireApproval = true,
  requireAdmin = false,
  requireFaculty = false,
}: ProtectedRouteProps) => {
  const { currentUser, loading, isApproved, isAdmin, isFaculty } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireApproval && !isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireFaculty && !isFaculty && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
