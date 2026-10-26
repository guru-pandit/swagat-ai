export const LOCAL_VAR = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
} as const;

export type LocalVar = (typeof LOCAL_VAR)[keyof typeof LOCAL_VAR];
