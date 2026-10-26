import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}