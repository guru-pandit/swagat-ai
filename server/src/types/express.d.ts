// Keep verified JWT claims separate from Passport's optional OAuth user object.
export {};

declare global {
    namespace Express {
        interface Request {
            authUser?: { userId: string; role: string };
        }
    }
}
