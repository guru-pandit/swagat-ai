import { useState } from 'react';
import {
    Box, Button, Input, VStack, Table,
    useDisclosure, Dialog, Field, Text,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';

interface Package {
    id: string;
    recipient?: { displayName: string };
    description: string;
    carrier: string;
    trackingNo?: string | null;
    arrivedAt: string;
}
interface StaffUser { id: string; displayName: string; email: string }

export default function PackagesPage() {
    const { open, onOpen, onClose } = useDisclosure();
    const qc = useQueryClient();

    const [form, setForm] = useState({
        recipientId: '',
        description: '',
        carrier: '',
        trackingNo: '',
    });

    const { data: packages = [], isLoading, isError } = useQuery({
        queryKey: ['packages'],
        queryFn: () => api.get('/packages/pending').then(r => r.data.data as Package[]),
    });
    const { data: staff = [] } = useQuery({
        queryKey: ['users', 'directory'],
        queryFn: () => api.get('/users/directory').then(r => r.data.data as StaffUser[]),
    });

    const log = useMutation({
        mutationFn: (body: typeof form) => api.post('/packages', body),
        onSuccess: () => {
            // Refresh the list after the server confirms the new package was saved.
            qc.invalidateQueries({ queryKey: ['packages'] });
            qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
            onClose();
            setForm({ recipientId: '', description: '', carrier: '', trackingNo: '' });
        },
    });

    const collect = useMutation({
        mutationFn: (id: string) => api.patch(`/packages/${id}/collect`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['packages'] });
            qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
        },
    });

    return (
        <Box p={6}>
            <PageHeader title="Packages" subtitle="Pending deliveries"
                action={<Button colorPalette="orange" onClick={onOpen}>+ Log Package</Button>} />

            <Table.Root size="sm">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Recipient</Table.ColumnHeader>
                        <Table.ColumnHeader>Description</Table.ColumnHeader>
                        <Table.ColumnHeader>Carrier</Table.ColumnHeader>
                        <Table.ColumnHeader>Tracking</Table.ColumnHeader>
                        <Table.ColumnHeader>Received</Table.ColumnHeader>
                        <Table.ColumnHeader>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {isLoading && <Table.Row><Table.Cell colSpan={6}><Text textAlign="center" py={4}>Loading packages…</Text></Table.Cell></Table.Row>}
                    {isError && <Table.Row><Table.Cell colSpan={6}><Text role="alert" color="var(--red)" textAlign="center" py={4}>Could not load packages.</Text></Table.Cell></Table.Row>}
                    {!isLoading && !isError && packages.length === 0 && (
                        <Table.Row><Table.Cell colSpan={6}>
                            <Text color="fg.muted" textAlign="center" py={4}>No pending packages 🎉</Text>
                        </Table.Cell></Table.Row>
                    )}
                    {packages.map((p) => (
                        <Table.Row key={p.id}>
                            <Table.Cell>{p.recipient?.displayName}</Table.Cell>
                            <Table.Cell>{p.description}</Table.Cell>
                            <Table.Cell>{p.carrier}</Table.Cell>
                            <Table.Cell>{p.trackingNo || '—'}</Table.Cell>
                            <Table.Cell>{new Date(p.arrivedAt).toLocaleDateString()}</Table.Cell>
                            <Table.Cell>
                                <Button size="xs" colorPalette="green"
                                    loading={collect.isPending}
                                    onClick={() => collect.mutate(p.id)}>Mark Collected</Button>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
            {log.isError && <Text role="alert" color="var(--red)" mt="3">Could not log the package. Check the recipient and try again.</Text>}
            {collect.isError && <Text role="alert" color="var(--red)" mt="3">Could not update package status. Please try again.</Text>}

            <Dialog.Root open={open} onOpenChange={onClose}>
                <Dialog.Content>
                    <Dialog.Header>Log Incoming Package</Dialog.Header>
                    <Dialog.Body>
                        <VStack gap={3}>
                            <Field.Root><Field.Label>Recipient</Field.Label>
                                <select className="form-control" value={form.recipientId} onChange={e => setForm(f => ({ ...f, recipientId: e.target.value }))}>
                                    <option value="">Choose the employee receiving this package</option>
                                    {staff.map(person => <option key={person.id} value={person.id}>{person.displayName} · {person.email}</option>)}
                                </select>
                            </Field.Root>
                            <Field.Root><Field.Label>Description</Field.Label>
                                <Input value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </Field.Root>
                            <Field.Root><Field.Label>Carrier</Field.Label>
                                <Input placeholder="FedEx / DHL / DTDC…" value={form.carrier}
                                    onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))} />
                            </Field.Root>
                            <Field.Root><Field.Label>Tracking number (optional)</Field.Label>
                                <Input value={form.trackingNo}
                                    onChange={e => setForm(f => ({ ...f, trackingNo: e.target.value }))} />
                            </Field.Root>
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button colorPalette="orange" loading={log.isPending} disabled={!form.recipientId || !form.carrier.trim()}
                            onClick={() => log.mutate(form)}>Log</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        </Box>
    );
}
