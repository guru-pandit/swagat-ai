import { useState } from 'react';
import { Box, Button, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

const STEPS = ['Your Details', 'Done'];

interface Data {
    fullName?: string;
    company?: string;
    email?: string;
    phone?: string;
    hostId?: string;
    notes?: string;
}

interface DetailsStepsProps {
    data: Data,
    onChange: (d: Data) => void;
    hosts: { id: string; displayName: string }[];
    hostsLoading: boolean;
}

function DetailsStep(
    { data, onChange, hosts, hostsLoading }: DetailsStepsProps
) {
    return (
        <VStack gap="4" p="8" maxW="480px" mx="auto">
            <Text fontSize="2xl" fontWeight="700">Welcome! Please check in.</Text>
            {([
                { name: 'fullName', placeholder: 'Full name *' },
                { name: 'company', placeholder: 'Company' },
                { name: 'email', placeholder: 'Email' },
                { name: 'phone', placeholder: 'Phone' },
                { name: 'notes', placeholder: 'Purpose of visit' },
            ] as const satisfies { name: keyof Data; placeholder: string }[]).map(f => (
                <Input
                    key={f.name}
                    size="lg"
                    placeholder={f.placeholder}
                    value={data[f.name] || ''}
                    onChange={e => onChange({
                        ...data,
                        [f.name]: e.target.value
                    })}
                />
            ))}
            <select className="form-control" aria-label="Choose your host" value={data.hostId ?? ''} onChange={event => onChange({ ...data, hostId: event.target.value })}>
                <option value="">{hostsLoading ? 'Loading hosts…' : 'Who are you visiting? *'}</option>
                {hosts.map(host => <option key={host.id} value={host.id}>{host.displayName}</option>)}
            </select>
        </VStack>
    );
}

export function KioskCheckin() {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<Data>({
        fullName: '',
        company: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { data: hosts = [], isLoading: hostsLoading, isError: hostsError } = useQuery({
        queryKey: ['public-hosts'],
        queryFn: () => api.get('/users/hosts').then(response => response.data.data as { id: string; displayName: string }[]),
    });

    const next = async () => {
        if (loading) return;
        if (step === 0 && (!form.fullName?.trim() || !form.hostId?.trim())) {
            setError('Please enter your name and choose who you are visiting.');
            return;
        }
        if (step === STEPS.length - 2) {
            // Submit before showing Done screen
            setLoading(true);
            setError('');
            try {
                await api.post('/visitors/checkin', { ...form, fullName: form.fullName?.trim(), hostId: form.hostId?.trim() });
            } catch {
                // Stay on the form when the API is unavailable so the visitor can retry.
                setError('We could not complete check-in. Please try again or contact reception.');
                return;
            }
            finally { setLoading(false); }
        }
        setStep(s => s + 1);
    };

    return (
        <Flex direction="column" h="100%">
            {/* Step indicator */}
            <Flex justify="center" gap="2" pt="6">
                {STEPS.map((_, i) => <Box key={i} w="8" h="1" borderRadius="full"
                    bg={i <= step ? 'var(--accent)' : 'var(--border)'} />)}
            </Flex>
            {/* Step content */}
            <Box flex="1" overflow="auto">
                {step === 0 && <DetailsStep data={form} onChange={setForm} hosts={hosts} hostsLoading={hostsLoading} />}
                {step === STEPS.length - 1 && <VStack p="8"><Text fontSize="3xl">✅ Welcome, {form.fullName}!</Text>
                    <Text color="var(--muted)">Your host has been notified.</Text></VStack>}
            </Box>
            {(error || (hostsError && step === 0)) && <Text role="alert" color="var(--red)" textAlign="center" px="6">{error || 'We could not load the host list. Please contact reception.'}</Text>}
            {/* Navigation */}
            {step < STEPS.length - 1 && (
                <Flex p="6" justify="space-between">
                    {step > 0 && <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Back</Button>}
                    <Button ml="auto" loading={loading} onClick={next}
                        bg="var(--accent)" color="black" size="lg">
        {step === STEPS.length - 2 ? 'Complete check-in' : 'Next'}
                    </Button>
                </Flex>
            )}
        </Flex>
    );
}
