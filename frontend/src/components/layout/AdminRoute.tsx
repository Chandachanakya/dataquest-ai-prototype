import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated? Send to admin login.
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Authenticated but not an admin? Send to normal dashboard (or kick out).
  if (profile && profile.role !== 'admin') {
    // We redirect to standard user dashboard if they stumble here
    return <Navigate to="/dashboard" replace />;
  }

  // Authenticated AND admin
  return <>{children}</>;
};
