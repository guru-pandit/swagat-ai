export const PACKAGE_STATUS = {
    PICKED_UP: 'PICKED_UP',
} as const;

export type PackageStatus = (typeof PACKAGE_STATUS)[keyof typeof PACKAGE_STATUS];
