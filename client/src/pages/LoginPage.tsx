import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { useAuthStore } from '../stores/auth.store';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  async function submit() {
    // Prevent duplicate requests and show a useful error without exposing server details.
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch {
      setError('Sign-in failed. Check your email and password, then try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="var(--bg)" p="4">
      <Box w="full" maxW="400px" p="8" bg="var(--surface)" borderRadius="16px" border="1px solid var(--border)">
        <Text fontSize="2xl" fontWeight="800" mb="2">🙏 Swagat AI</Text>
        <Text color="var(--muted)" mb="6">Sign in to the staff dashboard.</Text>
        <VStack gap="3">
          <Input aria-label="Email" type="email" autoComplete="username" placeholder="Email" value={email}
            onChange={event => setEmail(event.target.value)} onKeyDown={event => event.key === 'Enter' && submit()} />
          <Input aria-label="Password" type="password" autoComplete="current-password" placeholder="Password" value={password}
            onChange={event => setPassword(event.target.value)} onKeyDown={event => event.key === 'Enter' && submit()} />
          {error && <Text role="alert" color="var(--red)" fontSize="sm">{error}</Text>}
          <Button w="full" loading={loading} onClick={submit} bg="var(--accent)" color="black" disabled={!email || !password}>
            Sign in
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
