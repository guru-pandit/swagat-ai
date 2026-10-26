import { Box, Text, Icon } from '@chakra-ui/react';
import { type ReactNode } from 'react';

interface StatCardProps {
    label: string;
    value: string;
    icon: ReactNode;
    color?: string;
}

export function StatCard({ label, value, icon, color = 'var(--accent)' }: StatCardProps) {
    return (
        <Box
            bg="var(--surface)"
            color="var(--text)"
            borderRadius="xl"
            p={6}
            borderLeft="4px solid"
            borderColor={color}
            boxShadow="sm"
        >
            {icon && <Icon color={color} boxSize={6} mb={3}>{icon}</Icon>}
            <Text fontSize="2xl" fontWeight="bold">{value}</Text>
            <Text fontSize="sm" color="var(--muted)">{label}</Text>
        </Box>
    );
}