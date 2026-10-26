import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@chakra-ui/react';
import { useAuthStore } from '../stores/auth.store';
import { SocketProvider, useSocket } from '../hooks/useSocket';
import { SOCKET_EVENTS } from '@swagat/shared';

const links = [
    { to: '/', label: 'Overview', icon: '⌂' },
    { to: '/visitors', label: 'Visitors', icon: '♙', receptionOnly: true },
    { to: '/appointments', label: 'Appointments', icon: '▦' },
    { to: '/packages', label: 'Packages', icon: '▣', receptionOnly: true },
    { to: '/analytics', label: 'Analytics', icon: '▥', adminOnly: true },
];

export function StaffLayout() {
    return <SocketProvider><StaffWorkspace /></SocketProvider>;
}

function StaffWorkspace() {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const canManageDesk = ['ADMIN', 'RECEPTIONIST'].includes(user?.role ?? '');
    const socket = useSocket();
    const [notice, setNotice] = useState<{ message: string; kind: 'visitor' | 'package' | 'appointment' | 'security' } | null>(null);

    useEffect(() => {
        if (!socket) return;
        const visitorArrived = (event: { visitorName?: string }) => setNotice({ message: `${event.visitorName || 'A guest'} has arrived at reception.`, kind: 'visitor' });
        const packageReceived = (event: { carrier?: string }) => setNotice({ message: `A ${event.carrier || 'new'} delivery has arrived.`, kind: 'package' });
        const appointmentBooked = (event: { visitorName?: string }) => setNotice({ message: `Appointment booked for ${event.visitorName || 'a visitor'}.`, kind: 'appointment' });
        const securityHit = (event: { fullName?: string; reason?: string }) => setNotice({ message: `Security review: ${event.fullName || 'Visitor'}${event.reason ? ` · ${event.reason}` : ''}`, kind: 'security' });
        socket.on(SOCKET_EVENTS.VISITOR_ARRIVED, visitorArrived);
        socket.on(SOCKET_EVENTS.PACKAGE_RECEIVED, packageReceived);
        socket.on(SOCKET_EVENTS.APPOINTMENT_BOOKED, appointmentBooked);
        socket.on(SOCKET_EVENTS.SECURITY_WATCHLIST_HIT, securityHit);
        return () => {
            socket.off(SOCKET_EVENTS.VISITOR_ARRIVED, visitorArrived);
            socket.off(SOCKET_EVENTS.PACKAGE_RECEIVED, packageReceived);
            socket.off(SOCKET_EVENTS.APPOINTMENT_BOOKED, appointmentBooked);
            socket.off(SOCKET_EVENTS.SECURITY_WATCHLIST_HIT, securityHit);
        };
    }, [socket]);

    useEffect(() => {
        if (!notice) return;
        const timeout = window.setTimeout(() => setNotice(null), notice.kind === 'security' ? 20_000 : 8_000);
        return () => window.clearTimeout(timeout);
    }, [notice]);

    return (
        <div className="staff-shell">
            <aside className="staff-sidebar">
                <div className="brand-lockup"><span className="brand-mark">S</span><span>Swagat<span className="brand-muted">Desk</span></span></div>
                <div className="workspace-label">RECEPTION WORKSPACE</div>
                <nav className="staff-nav" aria-label="Main navigation">
                    {links.filter(link => (!link.receptionOnly || canManageDesk) && (!link.adminOnly || canManageDesk)).map(link => (
                        <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `staff-nav-link${isActive ? ' active' : ''}`}>
                            <span aria-hidden="true" className="nav-icon">{link.icon}</span>{link.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footnote">A calm, clear front desk for every arrival.</div>
            </aside>
            <section className="staff-main">
                <header className="staff-topbar">
                    <div className="topbar-status"><span className="status-dot" /> Reception desk <span className="topbar-divider">/</span> <span className="topbar-date">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
                    <div className="topbar-user"><div className="avatar">{user?.displayName?.charAt(0).toUpperCase() ?? 'S'}</div><div className="user-copy"><strong>{user?.displayName}</strong><span>{user?.role?.toLowerCase()}</span></div><Button size="sm" variant="ghost" onClick={logout}>Sign out</Button></div>
                </header>
                {notice && <div className={`live-notice live-notice-${notice.kind}`} role="status" aria-live="polite"><span>{notice.message}</span><button aria-label="Dismiss notification" onClick={() => setNotice(null)}>×</button></div>}
                <main className="staff-content"><Outlet /></main>
            </section>
        </div>
    );
}
