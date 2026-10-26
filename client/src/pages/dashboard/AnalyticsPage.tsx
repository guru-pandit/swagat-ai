import { useQuery } from '@tanstack/react-query';
import { Box, Text, Grid } from '@chakra-ui/react';
import { api } from '../../lib/api';

export function AnalyticsPage() {
    const { data } = useQuery({
        queryKey: ['analytics'],
        queryFn: () => api.get('/analytics/summary').then(r => r.data.data),
    });

    return (
        <Box p="8">
            <Text fontSize="2xl" fontWeight="700" mb="6">Analytics</Text>
            <Grid templateColumns="repeat(auto-fit,minmax(160px,1fr))" gap="4">
                <Box p="6" bg="var(--surface)" borderRadius="12px" border="1px solid var(--border)">
                    <Text fontSize="3xl" fontWeight="800" color="var(--accent)">{data?.total ?? '—'}</Text>
                    <Text color="var(--muted)" fontSize="sm">Total visits</Text>
                </Box>
                <Box p="6" bg="var(--surface)" borderRadius="12px" border="1px solid var(--border)">
                    <Text fontSize="3xl" fontWeight="800" color="var(--green)">{data?.checkedIn ?? '—'}</Text>
                    <Text color="var(--muted)" fontSize="sm">Currently in building</Text>
                </Box>
            </Grid>
            {/* Add charts here — Phase 15 */}
        </Box>
    );
}