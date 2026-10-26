export const MESSAGES = {
    INVALID_CREDENTIALS: 'Invalid credentials',
    SESSION_EXPIRED: 'Session expired - please log in again',
    NO_TOKEN: 'No Token',
    INVALID_TOKEN: 'Invalid or expired token',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',

    // Visitor
    HOST_NOT_FOUND: 'Host not found',

    // Appointment
    APPOINTMENT_CLASHED: 'Room already booked for this slot',

    // Package
    PACKAGE_NOT_FOUND: 'Package not found',
    PACKAGE_ALREADY_COLLECTED: 'Already collected',
} as const;

export type Messages = (typeof MESSAGES)[keyof typeof MESSAGES];
