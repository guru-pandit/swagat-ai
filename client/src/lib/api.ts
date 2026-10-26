import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
});

let refreshRequest: Promise<string> | null = null;

/** Attach token from localStorage on every request */
api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

/** Refresh an expired access token once, then replay the original request. */
api.interceptors.response.use(
    res => res,
    async err => {
        const request = err.config as (typeof err.config & { _retry?: boolean }) | undefined;
        const isAuthRequest = request?.url?.includes('/auth/login') || request?.url?.includes('/auth/refresh') || request?.url?.includes('/auth/logout');

        if (err.response?.status === 401 && request && !request._retry && !isAuthRequest) {
            request._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    // Share one refresh request when several API calls expire together.
                    refreshRequest ??= axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
                        .then(response => {
                            const nextAccessToken = response.data.data.accessToken as string;
                            const nextRefreshToken = response.data.data.refreshToken as string;
                            localStorage.setItem('accessToken', nextAccessToken);
                            localStorage.setItem('refreshToken', nextRefreshToken);
                            return nextAccessToken;
                        })
                        .finally(() => { refreshRequest = null; });
                    const token = await refreshRequest;
                    request.headers.Authorization = `Bearer ${token}`;
                    return api(request);
                } catch {
                    // A rejected refresh token means the saved session has expired completely.
                }
            }
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);
