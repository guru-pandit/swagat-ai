import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Spinner, Center } from '@chakra-ui/react';

export function ProtectedRoute({ roles }: { roles?: string[] }) {
    const { user, isLoading, hasCheckedSession, loadMe } = useAuthStore();

    useEffect(() => { if (!hasCheckedSession) void loadMe(); }, [hasCheckedSession, loadMe]);

    if (!hasCheckedSession || isLoading) {
        return <Center h="100vh"><Spinner size="xl" /></Center>;
    }
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return <Outlet />;
}
