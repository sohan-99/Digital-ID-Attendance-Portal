'use client';

import { useState, useEffect } from 'react';
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
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in as admin
    const token = localStorage.getItem('pundra_token');
    if (!token) {
      setChecking(false);
      return;
    }

    axios
      .get('http://localhost:3000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.user && res.data.user.isAdmin) {
          setAlreadyLoggedIn(true);
          setErr('You are already logged in as an admin. Redirecting to dashboard...');
          setTimeout(() => {
            window.location.href = '/admin';
          }, 2000);
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        // Token invalid or expired, allow login
        setChecking(false);
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      const user = res.data.user;
      if (!user || !user.isAdmin) {
        setErr('Access denied: this page is for admins only. Please use the regular login.');
        return;
      }
      localStorage.setItem('pundra_token', res.data.token);
      localStorage.setItem('pundra_user', JSON.stringify(user));
      
      // Try to store credentials
      try {
        if (typeof navigator !== 'undefined' && navigator.credentials && navigator.credentials.store) {
          try {
            // PasswordCredential is not standard in TypeScript, so we check if it exists
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
            /* ignore credential storage errors */
          }
        }
      } catch {
        /* ignore */
      }
      window.location.href = '/admin';
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { error?: string } | undefined;
        setErr(data?.error || 'Login failed');
      } else {
        setErr('Login failed');
      }
    }
  }

  if (checking || alreadyLoggedIn) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Paper
            elevation={4}
            sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, border: '2px solid', borderColor: 'secondary.main' }}
          >
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              {alreadyLoggedIn && err && (
                <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
                  {err}
                </Alert>
              )}
              {checking && (
                <Typography variant="body1" color="text.secondary">
                  Checking authentication...
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Paper
          elevation={4}
          sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, border: '2px solid', borderColor: 'secondary.main' }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'secondary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2,
              }}
            >
              <AdminIcon sx={{ fontSize: 50, color: 'secondary.dark' }} />
            </Box>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom color="secondary.dark">
              Admin Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Restricted access for administrators only
            </Typography>
            <Chip icon={<SecurityIcon />} label="Secure Login" color="secondary" size="small" sx={{ mt: 1 }} />
          </Box>

          <form onSubmit={submit} autoComplete="on" name="admin-login-form">
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Admin Email"
                type="email"
                name="admin-email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                fullWidth
                label="Admin Password"
                type={showPassword ? 'text' : 'password'}
                name="admin-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
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

              <Alert severity="info" icon={<SecurityIcon />} sx={{ borderRadius: 2 }}>
                This page is for administrators only. Regular users should use the standard login page.
              </Alert>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="secondary"
                size="large"
                startIcon={<AdminIcon />}
                sx={{ py: 1.5, fontSize: '1.1rem' }}
              >
                Login as Admin
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Link href="/login" passHref legacyBehavior>
              <MuiLink underline="hover" sx={{ fontSize: '0.95rem' }}>
                Regular user login
              </MuiLink>
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
