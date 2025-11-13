'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Alert,
  Link as MuiLink,
  Stack,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from '@mui/icons-material';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isAdminLogin] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return params.get('admin') ? true : false;
      }
    } catch {
      // Ignore URL parsing errors
    }
    return false;
  });

  // Check for session expired message
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'session_expired') {
        setErr('Your session has expired. Please login again.');
        // Remove the error parameter from URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('pundra_token');
      const userStr = localStorage.getItem('pundra_user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          // Redirect to appropriate page based on user type
          setIsRedirecting(true);
          if (user.isAdmin) {
            router.push('/admin');
          } else {
            router.push('/profile');
          }
          return true;
        } catch (e) {
          console.error('Error parsing user data:', e);
          // Clear invalid data
          localStorage.removeItem('pundra_token');
          localStorage.removeItem('pundra_user');
        }
      }
      return false;
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAdminLogin) return;
    const t = setTimeout(() => {
      try {
        if (emailRef.current) { emailRef.current.value = ''; setEmail(''); }
        if (passwordRef.current) { passwordRef.current.value = ''; setPassword(''); }
      } catch {
        // Ignore ref errors
      }
    }, 50);
    return () => clearTimeout(t);
  }, [isAdminLogin]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); 
    setErr(null);
    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      
      // Ensure we have valid data before storing
      if (!res.data.token || !res.data.user) {
        throw new Error('Invalid response from server');
      }
      
      // Store token and user data
      localStorage.setItem('pundra_token', res.data.token);
      localStorage.setItem('pundra_user', JSON.stringify(res.data.user));
      
      // Verify the token was stored correctly
      const storedToken = localStorage.getItem('pundra_token');
      if (!storedToken || storedToken !== res.data.token) {
        throw new Error('Failed to store authentication token');
      }
      
      // Dispatch custom event to notify NavBar of auth change
      window.dispatchEvent(new Event('authChange'));
      
      // Try to store credentials (browser feature)
      try {
        if (typeof navigator !== 'undefined' && navigator.credentials && navigator.credentials.store) {
          try {
            const WindowWithCredentials = window as typeof window & {
              PasswordCredential?: {
                new (data: { id: string; password: string }): Credential;
              };
            };
            
            if (WindowWithCredentials.PasswordCredential) {
              const cred = new WindowWithCredentials.PasswordCredential({ id: email, password });
              await navigator.credentials.store(cred);
            }
          } catch {
            // Ignore credential storage errors
          }
        }
      } catch {
        // Ignore credential API errors
      }
      
      // Use a small delay to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (res.data.user && res.data.user.isAdmin) window.location.href = '/admin';
      else window.location.href = '/profile';
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string; hint?: string } | undefined;
        let errorMsg = data?.error || 'Login failed';
        if (data?.hint) {
          errorMsg += ` (${data.hint})`;
        }
        setErr(errorMsg);
      } else if (error instanceof Error) {
        setErr(error.message);
      } else {
        setErr('Login failed');
      }
    }
  }

  // Show redirecting message if already logged in
  if (isRedirecting) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Already logged in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <LoginIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to access your account
            </Typography>
          </Box>

          <form onSubmit={submit} autoComplete={isAdminLogin ? 'off' : 'on'} name="user-login-form">
            {isAdminLogin && (
              <>
                <input type="text" name="fake-username" autoComplete="username" style={{position:'absolute', left:'-10000px', top:'auto'}} />
                <input type="password" name="fake-password" autoComplete="current-password" style={{position:'absolute', left:'-10000px', top:'auto'}} />
              </>
            )}
            
            <Stack spacing={3}>
              <TextField
                inputRef={emailRef}
                fullWidth
                label="Email Address"
                type="email"
                name="user-email"
                autoComplete={isAdminLogin ? 'off' : 'email'}
                value={email}
                onChange={e=>setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                inputRef={passwordRef}
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="user-password"
                autoComplete={isAdminLogin ? 'new-password' : 'current-password'}
                value={password}
                onChange={e=>setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {err && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {err}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ py: 1.5, fontSize: '1.1rem' }}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <MuiLink 
              component={Link} 
              href="/register" 
              underline="hover" 
              sx={{ fontSize: '0.95rem' }}
            >
              Create new account
            </MuiLink>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
