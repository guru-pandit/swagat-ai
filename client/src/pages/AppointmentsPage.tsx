import { useState } from 'react';
import {
  Box, Button, Input, Text, Textarea, VStack, HStack,
  Table, Badge, Dialog, Field,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuthStore } from '../stores/auth.store';

interface AppointmentForm {
  visitorName: string; visitorEmail: string;
  purpose: string;  startsAt: string;  endsAt: string; hostId: string;
}
interface StaffUser { id: string; displayName: string; email: string }

interface Appointment {
  id: string;
  visitor?: { fullName: string; email?: string | null; visits?: { id: string }[] };
  host?: { displayName: string };
  hostId: string;
  title: string;
  startsAt: string;
  endsAt: string;
}

export default function AppointmentsPage() {
  const user = useAuthStore(state => state.user);
  const canScheduleForTeam = ['ADMIN', 'RECEPTIONIST'].includes(user?.role ?? '');
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const [formError, setFormError] = useState('');
  const [checkInError, setCheckInError] = useState('');
  const [form, setForm] = useState<AppointmentForm>({
    visitorName: '', visitorEmail: '', purpose: '', startsAt: '', endsAt: '', hostId: user?.id ?? '',
  });
  const { data: staff = [] } = useQuery({
    queryKey: ['users', 'directory'],
    queryFn: () => api.get('/users/directory').then(r => r.data.data as StaffUser[]),
    enabled: canScheduleForTeam,
  });

  const { data: appointments = [], isLoading, isError } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('/appointments/mine').then(r => r.data.data as Appointment[]),
  });

  const create = useMutation({
    mutationFn: (body: AppointmentForm) => api.post('/appointments', {
      ...body,
      // datetime-local fields have no timezone, so send an explicit ISO timestamp to the server.
      startsAt: new Date(body.startsAt).toISOString(),
      endsAt: new Date(body.endsAt).toISOString(),
    }),
    onSuccess: () => {
      // Refresh the appointment list and dashboard counts after the server saves the booking.
      void qc.invalidateQueries({ queryKey: ['appointments'] });
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      setOpen(false);
      setForm({ visitorName: '', visitorEmail: '', purpose: '', startsAt: '', endsAt: '', hostId: user?.id ?? '' });
      setFormError('');
    },
    onError: error => setFormError((error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not book this appointment. Check the details and try again.'),
  });
  const checkIn = useMutation({
    mutationFn: (appointmentId: string) => api.post(`/appointments/${appointmentId}/checkin`),
    onSuccess: () => {
      // The new visit appears in the register and updates the dashboard totals immediately.
      setCheckInError('');
      void qc.invalidateQueries({ queryKey: ['appointments'] });
      void qc.invalidateQueries({ queryKey: ['visitors'] });
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
    onError: error => setCheckInError((error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not check in this appointment.'),
  });

  return (
    <Box p={6}>
      <PageHeader title="Appointments" subtitle="Scheduled visits"
        action={<Button colorPalette="orange" onClick={() => { setFormError(''); setForm(current => ({ ...current, hostId: user?.id ?? '' })); setOpen(true); }}>+ New</Button>} />

      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Visitor</Table.ColumnHeader>
            <Table.ColumnHeader>Host</Table.ColumnHeader>
            <Table.ColumnHeader>Purpose</Table.ColumnHeader>
            <Table.ColumnHeader>Starts</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Arrival</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && <Table.Row><Table.Cell colSpan={6}>Loading appointments…</Table.Cell></Table.Row>}
          {isError && <Table.Row><Table.Cell colSpan={6}>Could not load appointments. Please refresh.</Table.Cell></Table.Row>}
          {!isLoading && !isError && appointments.length === 0 && <Table.Row><Table.Cell colSpan={6}>No appointments scheduled yet.</Table.Cell></Table.Row>}
          {appointments.map((a) => (
            <Table.Row key={a.id}>
              <Table.Cell>{a.visitor?.fullName}</Table.Cell>
              <Table.Cell>{a.host?.displayName ?? '—'}</Table.Cell>
              <Table.Cell>{a.title}</Table.Cell>
              <Table.Cell>{new Date(a.startsAt).toLocaleString()}</Table.Cell>
              <Table.Cell>
                <Badge colorPalette={new Date(a.startsAt) > new Date() ? 'blue' : new Date(a.endsAt) >= new Date() ? 'green' : 'gray'}>
                  {new Date(a.startsAt) > new Date() ? 'Upcoming' : new Date(a.endsAt) >= new Date() ? 'In progress' : 'Complete'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {a.visitor?.visits?.length ? <span className="status-pill status-active">On site</span>
                  : Date.now() >= new Date(a.startsAt).getTime() - 60 * 60 * 1000 && Date.now() <= new Date(a.endsAt).getTime()
                  ? <Button size="xs" variant="outline" loading={checkIn.isPending && checkIn.variables === a.id} disabled={checkIn.isPending} onClick={() => { setCheckInError(''); checkIn.mutate(a.id); }}>Check in guest</Button>
                  : <span className="table-muted">Not in check-in window</span>}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {checkInError && <Text role="alert" color="var(--red)" mt="3">{checkInError}</Text>}

      <Dialog.Root open={open} onOpenChange={details => setOpen(details.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner><Dialog.Content>
          <Dialog.Header><Dialog.Title>Book a visitor appointment</Dialog.Title></Dialog.Header>
          <Dialog.Body>
            <VStack gap={3}>
              <Field.Root><Field.Label>Visitor Name</Field.Label>
                <Input value={form.visitorName}
                  onChange={e => setForm(f => ({...f, visitorName: e.target.value}))} />
              </Field.Root>
              <Field.Root><Field.Label>Visitor Email</Field.Label>
                <Input type="email" value={form.visitorEmail}
                  onChange={e => setForm(f => ({...f, visitorEmail: e.target.value}))} />
              </Field.Root>
              <Field.Root><Field.Label>Purpose</Field.Label>
                <Textarea value={form.purpose}
                  onChange={e => setForm(f => ({...f, purpose: e.target.value}))} />
              </Field.Root>
              <Field.Root><Field.Label>Host</Field.Label>
                <select className="form-control" value={form.hostId} disabled={user?.role === 'EMPLOYEE'} onChange={e => setForm(f => ({ ...f, hostId: e.target.value }))}>
                  {user?.role !== 'EMPLOYEE' && <option value="">Choose the employee hosting this visit</option>}
                  {staff.map(person => <option key={person.id} value={person.id}>{person.displayName} · {person.email}</option>)}
                </select>
              </Field.Root>
              <HStack w="full">
                <Field.Root flex={1}><Field.Label>Start</Field.Label>
                  <Input type="datetime-local" value={form.startsAt}
                    onChange={e => setForm(f => ({...f, startsAt: e.target.value}))} />
                </Field.Root>
                <Field.Root flex={1}><Field.Label>End</Field.Label>
                  <Input type="datetime-local" value={form.endsAt}
                    onChange={e => setForm(f => ({...f, endsAt: e.target.value}))} />
                </Field.Root>
              </HStack>
            </VStack>
            {formError && <Text role="alert" color="var(--red)" mt="3">{formError}</Text>}
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button colorPalette="orange" loading={create.isPending}
              disabled={!form.hostId || !form.visitorName.trim() || !form.purpose.trim() || !form.startsAt || !form.endsAt}
              onClick={() => create.mutate(form)}>Book</Button>
          </Dialog.Footer>
        </Dialog.Content></Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
