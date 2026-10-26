import { Flex, Heading, Text, Box } from '@chakra-ui/react';
import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode; // e.g. a primary button
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Flex justify="space-between" align="center" mb={6}>
      <Box>
        <Heading size="lg">{title}</Heading>
        {subtitle && <Text color="fg.muted" mt={1}>{subtitle}</Text>}
      </Box>
      {action}
    </Flex>
  );
}