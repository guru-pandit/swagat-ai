import { useMemo, useState } from 'react';
import { Button, Dialog, Input, Text } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Host { id: string; displayName: string; email?: string; role?: string }
interface Visit {
    id: string;
    status: string;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    notes?: string | null;
    badgeCode?: string | null;
    visitor: { fullName: string; email?: string | null; phone?: string | null; company?: string | null; watchListHit?: boolean; host: Host };
}
interface VisitorForm { fullName: string; company: string; email: string; phone: string; hostId: string; notes: string }

const emptyForm: VisitorForm = { fullName: '', company: '', email: '', phone: '', hostId: '', notes: '' };
const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

function errorMessage(error: unknown) {
    return (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'The request could not be completed. Please try again.';
}

function printBadge(visit: Visit) {
    // Use textContent for guest-controlled names so badge printing cannot inject HTML.
    const printWindow = window.open('', '_blank', 'width=420,height=320');
    if (!printWindow) return;
    printWindow.document.write('<!doctype html><html><head><title>Visitor badge</title><style>body{font:16px Arial,sans-serif;padding:28px;color:#111}.badge{border:2px solid #222;border-radius:12px;padding:24px;text-align:center}.muted{color:#555;font-size:13px}.code{font-size:28px;font-weight:700;letter-spacing:4px;margin:20px 0}</style></head><body><main class="badge"><div class="muted">VISITOR</div><h1 id="guest"></h1><p id="company" class="muted"></p><p>Host: <span id="host"></span></p><div id="code" class="code"></div><div class="muted">Please return this badge at reception</div></main></body></html>');
    printWindow.document.close();
    printWindow.document.getElementById('guest')!.textContent = visit.visitor.fullName;
    printWindow.document.getElementById('company')!.textContent = visit.visitor.company || '';
    printWindow.document.getElementById('host')!.textContent = visit.visitor.host.displayName;
    printWindow.document.getElementById('code')!.textContent = visit.badgeCode || 'VISITOR';
    printWindow.focus();
    printWindow.print();
}

export default function VisitorsPage() {
    const [date, setDate] = useState(today);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<VisitorForm>(emptyForm);
    const [formError, setFormError] = useState('');
    const queryClient = useQueryClient();

    const visitsQuery = useQuery({
        queryKey: ['visitors', date],
        // The selected day is entered in local time; send its UTC offset so the API returns that same day.
        queryFn: () => api.get('/visitors', { params: { date, timezoneOffset: new Date(`${date}T00:00:00`).getTimezoneOffset() } }).then(response => response.data.data as Visit[]),
    });
    const hostsQuery = useQuery({
        queryKey: ['users', 'directory'],
        queryFn: () => api.get('/users/directory').then(response => response.data.data as Host[]),
    });

    const invalidateDeskData = () => {
        // A visit changes the register and dashboard metrics at the same time.
        void queryClient.invalidateQueries({ queryKey: ['visitors'] });
        void queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    };
    const checkIn = useMutation({
        mutationFn: (body: VisitorForm) => api.post('/visitors/staff-checkin', body),
        onSuccess: () => {
            invalidateDeskData();
            setOpen(false);
            setForm(emptyForm);
            setFormError('');
        },
        onError: error => setFormError(errorMessage(error)),
    });
    const checkOut = useMutation({
        mutationFn: (visitId: string) => api.patch(`/visitors/${visitId}/checkout`),
        onSuccess: invalidateDeskData,
    });

    const filteredVisits = useMemo(() => (visitsQuery.data ?? []).filter(visit => {
        const matchesStatus = status === 'ALL' || visit.status === status;
        const haystack = `${visit.visitor.fullName} ${visit.visitor.company ?? ''} ${visit.visitor.host.displayName}`.toLowerCase();
        return matchesStatus && haystack.includes(search.trim().toLowerCase());
    }), [visitsQuery.data, status, search]);

    function submitCheckIn() {
        if (!form.fullName.trim() || !form.hostId) {
            setFormError('Enter the visitor name and select the host.');
            return;
        }
        setFormError('');
        checkIn.mutate({ ...form, fullName: form.fullName.trim(), company: form.company.trim(), email: form.email.trim(), phone: form.phone.trim(), notes: form.notes.trim() });
    }

    const activeCount = (visitsQuery.data ?? []).filter(visit => visit.status === 'CHECKED_IN').length;

    return (
        <div>
            <div className="page-toolbar">
                <div><div className="page-eyebrow">Guest management</div><h1 className="reception-title">Visitor register</h1><p className="reception-subtitle">Welcome guests, notify their host, and keep an accurate record of who is on site.</p></div>
                <div className="toolbar-actions"><Button colorPalette="orange" onClick={() => { setForm(emptyForm); setFormError(''); setOpen(true); }}>+ Check in visitor</Button></div>
            </div>

            <div className="metric-grid" style={{ marginBottom: 18 }}>
                <div className="desk-card metric-card"><div className="metric-label">Visits on selected day</div><div className="metric-value">{visitsQuery.data?.length ?? '—'}</div><div className="metric-foot">Checked in or out</div></div>
                <div className="desk-card metric-card"><div className="metric-label">Currently on site</div><div className="metric-value" style={{ color: 'var(--green)' }}>{visitsQuery.isLoading ? '—' : activeCount}</div><div className="metric-foot">Guests not yet checked out</div></div>
                <div className="desk-card metric-card"><div className="metric-label">Hosts available</div><div className="metric-value" style={{ color: 'var(--blue)' }}>{hostsQuery.data?.length ?? '—'}</div><div className="metric-foot">Active staff directory</div></div>
                <div className="desk-card metric-card"><div className="metric-label">Register date</div><div className="metric-value" style={{ fontSize: 18, marginTop: 15 }}>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div><div className="metric-foot">Choose a date below</div></div>
            </div>

            <section className="desk-card section-card">
                <div className="page-toolbar" style={{ marginBottom: 15, alignItems: 'center' }}>
                    <div><div className="section-title">Arrivals and departures</div><div className="section-caption">Search this register or filter by visit status.</div></div>
                    <div className="toolbar-actions">
                        <Input className="search-control" aria-label="Search visitors" placeholder="Search visitor, company, or host" value={search} onChange={event => setSearch(event.target.value)} />
                        <select className="form-control" aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)} style={{ width: 145 }}>
                            <option value="ALL">All visits</option><option value="CHECKED_IN">On site</option><option value="CHECKED_OUT">Checked out</option>
                        </select>
                        <Input aria-label="Register date" type="date" value={date} onChange={event => setDate(event.target.value)} style={{ width: 150 }} />
                    </div>
                </div>

                {visitsQuery.isError && <div className="alert-error" role="alert">Could not load the visitor register. Please refresh and try again.</div>}
                {checkOut.isError && <div className="alert-error" role="alert" style={{ marginBottom: 12 }}>{errorMessage(checkOut.error)}</div>}
                <div className="table-wrap">
                    <table className="desk-table">
                        <thead><tr><th>Visitor</th><th>Host</th><th>Purpose</th><th>Contact</th><th>Check in</th><th>Badge</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {visitsQuery.isLoading && <tr><td colSpan={8} className="empty-state">Loading visitor register…</td></tr>}
                            {!visitsQuery.isLoading && !visitsQuery.isError && filteredVisits.length === 0 && <tr><td colSpan={8} className="empty-state">{search ? 'No visitors match your search.' : 'No visits recorded for this date.'}</td></tr>}
                            {filteredVisits.map(visit => (
                                <tr key={visit.id}>
                                    <td><strong>{visit.visitor.fullName}</strong><div className="table-muted">{visit.visitor.company || 'Personal visit'}</div>{visit.visitor.watchListHit && <span className="status-pill" style={{ marginTop: 6, color: 'var(--red)', background: 'rgba(248,113,113,.1)' }}>Review with security</span>}</td>
                                    <td>{visit.visitor.host.displayName}</td>
                                    <td>{visit.notes || <span className="table-muted">Not recorded</span>}</td>
                                    <td>{visit.visitor.email || visit.visitor.phone || <span className="table-muted">Not provided</span>}</td>
                                    <td>{visit.checkedInAt ? new Date(visit.checkedInAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}{visit.checkedOutAt && <div className="table-muted">Out {new Date(visit.checkedOutAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>}</td>
                                    <td><span className={`status-pill ${visit.status === 'CHECKED_IN' ? 'status-active' : 'status-complete'}`}>{visit.status === 'CHECKED_IN' ? 'On site' : 'Checked out'}</span></td>
                                    <td>{visit.badgeCode ? <Button size="xs" variant="ghost" onClick={() => printBadge(visit)}>{visit.badgeCode} · Print</Button> : <span className="table-muted">—</span>}</td>
                                    <td>{visit.status === 'CHECKED_IN' ? <Button size="xs" variant="outline" loading={checkOut.isPending} onClick={() => checkOut.mutate(visit.id)}>Check out</Button> : <span className="table-muted">Complete</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <Dialog.Root open={open} onOpenChange={details => setOpen(details.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner><Dialog.Content>
                    <Dialog.Header><Dialog.Title>Check in a visitor</Dialog.Title></Dialog.Header>
                    <Dialog.Body>
                        <Text fontSize="sm" color="var(--muted)" mb="4">Add guest details and notify their host that they have arrived.</Text>
                        <div className="form-grid">
                            <label className="form-field form-full"><span className="form-label">Visitor name *</span><input className="form-control" autoFocus value={form.fullName} onChange={event => setForm(current => ({ ...current, fullName: event.target.value }))} placeholder="Full name" /></label>
                            <label className="form-field"><span className="form-label">Company</span><input className="form-control" value={form.company} onChange={event => setForm(current => ({ ...current, company: event.target.value }))} placeholder="Company name" /></label>
                            <label className="form-field"><span className="form-label">Phone</span><input className="form-control" type="tel" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} placeholder="Phone number" /></label>
                            <label className="form-field form-full"><span className="form-label">Email</span><input className="form-control" type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} placeholder="name@example.com" /></label>
                            <label className="form-field form-full"><span className="form-label">Host *</span><select className="form-control" value={form.hostId} onChange={event => setForm(current => ({ ...current, hostId: event.target.value }))}><option value="">Choose the employee being visited</option>{hostsQuery.data?.map(host => <option value={host.id} key={host.id}>{host.displayName} · {host.email}</option>)}</select></label>
                            <label className="form-field form-full"><span className="form-label">Purpose of visit</span><input className="form-control" value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} placeholder="Meeting, delivery, interview…" /></label>
                        </div>
                        {formError && <div className="alert-error" role="alert" style={{ marginTop: 14 }}>{formError}</div>}
                    </Dialog.Body>
                    <Dialog.Footer><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button colorPalette="orange" loading={checkIn.isPending} onClick={submitCheckIn}>Save check-in</Button></Dialog.Footer>
                </Dialog.Content></Dialog.Positioner>
            </Dialog.Root>
        </div>
    );
}
