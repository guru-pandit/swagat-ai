import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Text } from '@chakra-ui/react';
import { api } from '../../lib/api';
import { useSocket } from '../../hooks/useSocket';
import { SOCKET_EVENTS } from '@swagat/shared';
import { useAuthStore } from '../../stores/auth.store';

interface VisitRow {
    id: string;
    status: string;
    checkedInAt: string | null;
    visitor: { fullName: string; company?: string | null; host: { displayName: string } };
}

interface DashboardSummary {
    visitorsToday: number;
    activeVisitors: number;
    pendingPackages: number;
    upcomingAppointments: number;
    recentVisits: VisitRow[];
}

const metricCards = [
    { key: 'visitorsToday', label: 'Arrivals today', note: 'All visits recorded today', color: 'var(--accent)' },
    { key: 'activeVisitors', label: 'On site now', note: 'Guests currently checked in', color: 'var(--green)' },
    { key: 'upcomingAppointments', label: 'Upcoming visits', note: 'Scheduled from now onward', color: 'var(--blue)' },
    { key: 'pendingPackages', label: 'Packages to route', note: 'Deliveries awaiting pickup', color: 'var(--cyan)' },
] as const;

function localDayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function DashboardHome() {
    const user = useAuthStore(state => state.user);
    const isReception = ['ADMIN', 'RECEPTIONIST'].includes(user?.role ?? '');
    const socket = useSocket();
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['dashboard', 'summary'],
        queryFn: () => api.get('/dashboard/summary', {
            params: { date: localDayKey(), timezoneOffset: new Date().getTimezoneOffset() },
        }).then(response => response.data.data as DashboardSummary),
        refetchInterval: 30_000,
    });

    useEffect(() => {
        if (!socket) return;
        // Server totals are authoritative, so live events refresh the summary instead of changing local counters.
        const refresh = () => void queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
        socket.on(SOCKET_EVENTS.VISITOR_ARRIVED, refresh);
        socket.on(SOCKET_EVENTS.VISITOR_LEFT, refresh);
        socket.on(SOCKET_EVENTS.PACKAGE_RECEIVED, refresh);
        socket.on(SOCKET_EVENTS.APPOINTMENT_BOOKED, refresh);
        return () => {
            socket.off(SOCKET_EVENTS.VISITOR_ARRIVED, refresh);
            socket.off(SOCKET_EVENTS.VISITOR_LEFT, refresh);
            socket.off(SOCKET_EVENTS.PACKAGE_RECEIVED, refresh);
            socket.off(SOCKET_EVENTS.APPOINTMENT_BOOKED, refresh);
        };
    }, [socket, queryClient]);

    return (
        <div>
            <div className="page-toolbar">
                <div>
                    <div className="page-eyebrow">Front desk overview</div>
                    <h1 className="reception-title">Good day. Here’s the desk.</h1>
                    <p className="reception-subtitle">Live status for arrivals, appointments, and deliveries.</p>
                </div>
                {isReception && <div className="toolbar-actions"><Button asChild colorPalette="orange"><Link to="/visitors">+ Check in visitor</Link></Button></div>}
            </div>

            {isError && <div className="alert-error" role="alert">The live desk summary could not be loaded. You can still use the visitor register and other sections.</div>}
            <div className="metric-grid" aria-label="Reception desk summary">
                {metricCards.map(card => (
                    <div className="desk-card metric-card" key={card.key}>
                        <div className="metric-label">{card.label}</div>
                        <div className="metric-value" style={{ color: card.color }}>{isLoading ? '—' : data?.[card.key] ?? 0}</div>
                        <div className="metric-foot">{card.note}</div>
                    </div>
                ))}
            </div>

            <div className="dashboard-lower">
                <section className="desk-card section-card">
                    <div className="page-toolbar" style={{ marginBottom: 12, alignItems: 'center' }}>
                        <div><div className="section-title">Today’s arrivals</div><div className="section-caption">Most recent visitors logged at reception</div></div>
                        <Button asChild size="sm" variant="ghost"><Link to="/visitors">Open register →</Link></Button>
                    </div>
                    {isLoading ? <div className="empty-state">Loading today’s arrivals…</div> : data?.recentVisits?.length ? (
                        <div className="table-wrap">
                            <table className="desk-table">
                                <thead><tr><th>Visitor</th><th>Host</th><th>Arrived</th><th>Status</th></tr></thead>
                                <tbody>{data.recentVisits.map(visit => (
                                    <tr key={visit.id}>
                                        <td><strong>{visit.visitor.fullName}</strong><div className="table-muted">{visit.visitor.company || 'Personal visit'}</div></td>
                                        <td>{visit.visitor.host.displayName}</td>
                                        <td>{visit.checkedInAt ? new Date(visit.checkedInAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}</td>
                                        <td><span className={`status-pill ${visit.status === 'CHECKED_IN' ? 'status-active' : 'status-complete'}`}>{visit.status === 'CHECKED_IN' ? 'On site' : 'Checked out'}</span></td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    ) : <div className="empty-state">{isError ? 'Visit activity will appear here when the service is available.' : 'No visitors have checked in today.'}</div>}
                </section>

                <section className="desk-card section-card">
                    <div className="section-title">Desk shortcuts</div>
                    <div className="section-caption">Common reception tasks, one click away</div>
                    <div className="quick-actions">
                        {isReception && <Link className="quick-action" to="/visitors"><span>Register or check out a visitor</span><span>→</span></Link>}
                        <Link className="quick-action" to="/appointments"><span>Book an upcoming visit</span><span>→</span></Link>
                        {isReception && <Link className="quick-action" to="/packages"><span>Log a delivery for an employee</span><span>→</span></Link>}
                        <Link className="quick-action" to="/kiosk" target="_blank"><span>Open the visitor kiosk</span><span>↗</span></Link>
                    </div>
                    <Box mt="4" p="3" borderRadius="9px" bg="rgba(34, 211, 238, .06)" border="1px solid rgba(34, 211, 238, .12)">
                        <Text fontSize="xs" color="var(--muted)">The desk refreshes every 30 seconds and updates when a visitor checks in or out.</Text>
                    </Box>
                </section>
            </div>
        </div>
    );
}
