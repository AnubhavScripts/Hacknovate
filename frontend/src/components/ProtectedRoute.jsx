import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * ProtectedRoute — wraps routes that require authentication.
 * Shows a loading spinner while auth state is resolving,
 * redirects to /login if unauthenticated.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
