import { create } from 'zustand';
import { api } from '../lib/api';

interface AuthState {
    user: null | { id: string; email: string; role: string; displayName: string };
    isLoading: boolean;
    hasCheckedSession: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loadMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
    user: null,
    isLoading: false,
    hasCheckedSession: false,

    async login(email, password) {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        const me = await api.get('/auth/me');
        set({ user: me.data.data });
    },

    async logout() {
        const refreshToken = localStorage.getItem('refreshToken');
        try {
            if (refreshToken) await api.post('/auth/logout', { refreshToken });
        } catch {
            // Local credentials are still cleared below if the server cannot be reached.
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({ user: null, hasCheckedSession: true });
            window.location.href = '/login';
        }
    },

    async loadMe() {
        // Mark session restoration explicitly so protected pages do not flash the login screen.
        set({ isLoading: true });
        try {
            const { data } = await api.get('/auth/me');
            set({ user: data.data });
        } catch { set({ user: null }); }
        finally { set({ isLoading: false, hasCheckedSession: true }); }
    },
}));
