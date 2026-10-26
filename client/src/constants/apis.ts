export const AUTH_API = {
    LOGIN: '/auth/login',
} as const;

export type AuthApi = (typeof AUTH_API)[keyof typeof AUTH_API];
