import { Box, Flex, Text } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function KioskLayout() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        // Request fullscreen on kiosk tablet
        document.documentElement.requestFullscreen().catch(() => { });
        // A single interval keeps the clock fresh without restarting it on every render.
        const t = setInterval(() => setTime(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

    return (
        <Flex direction="column" h="100vh" bg="var(--bg)">
            <Flex px="8" py="4" align="center" justify="space-between"
                borderBottom="1px solid" borderColor="var(--border)">
                <Text fontSize="xl" fontWeight="700" color="var(--accent)">🙏 Swagat AI</Text>
                <Text color="var(--muted)">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </Flex>
            <Box flex="1" overflow="auto"><Outlet /></Box>
            <Flex px="8" py="3" justify="center" borderTop="1px solid" borderColor="var(--border)">
                <Text fontSize="sm" color="var(--muted)">Need help? Call reception — Ext. 100</Text>
            </Flex>
        </Flex>
    );
}
