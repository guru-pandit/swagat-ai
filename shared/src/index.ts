// Const objects keep runtime enum values while remaining compatible with erasable TS syntax.
export const Role = {
    ADMIN: 'ADMIN',
    RECEPTIONIST: 'RECEPTIONIST',
    EMPLOYEE: 'EMPLOYEE',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const VisitorStatus = {
    EXPECTED: 'EXPECTED',
    CHECKED_IN: 'CHECKED_IN',
    CHECKED_OUT: 'CHECKED_OUT',
    NO_SHOW: 'NO_SHOW',
} as const;
export type VisitorStatus = (typeof VisitorStatus)[keyof typeof VisitorStatus];

export const PackageStatus = {
    RECEIVED: 'RECEIVED',
    NOTIFIED: 'NOTIFIED',
    COLLECTED: 'COLLECTED',
} as const;
export type PackageStatus = (typeof PackageStatus)[keyof typeof PackageStatus];

// Every API call returns this shape - constraints across the whole app
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface AuthUser {
    id: string;
    email: string;
    displayName: string;
    role: Role;
    avatarUrl?: string;
}

export const SOCKET_EVENTS = {
    VISITOR_ARRIVED: 'visitor:arrived',
    VISITOR_LEFT: 'visitor:left',
    APPOINTMENT_BOOKED: 'appointment:booked',
    SECURITY_WATCHLIST_HIT: 'security:watchlist_hit',
    PACKAGE_RECEIVED: 'package:received',
    SUPPORT_TICKET: 'support:new_ticket',
    ROOM_RELEASED: 'room:released',
} as const;
