import { Redirect, useLocation } from 'react-router-dom';  // ✅ Changed
import Spinner from './Spinner';
import { useAuth } from '../hooks/useAuth';

export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50">
        <Spinner label="Restoring session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Redirect  // ✅ Changed from Navigate
        to="/login"
        state={{ from: location }}  // ✅ v5 uses 'state' instead of separate 'replace'
      />
    );
  }

  return children;
}