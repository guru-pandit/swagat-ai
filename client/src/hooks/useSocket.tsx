import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: PropsWithChildren) {
    const user = useAuthStore(state => state.user);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!user) {
            setSocket(null);
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
        const connection = io(apiUrl.replace(/\/api\/?$/, ''), {
            // Read the latest token at each reconnect so access-token refreshes keep realtime alive.
            auth: callback => callback({ token: localStorage.getItem('accessToken') }),
        });
        setSocket(connection);

        return () => {
            connection.disconnect();
            setSocket(null);
        };
    }, [user]);

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

// Every reception screen shares one authenticated connection instead of opening its own socket.
export function useSocket() {
    return useContext(SocketContext);
}
