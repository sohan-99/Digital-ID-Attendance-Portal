'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isAdminLogin, setIsAdminLogin] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return params.get('admin') ? true : false;
      }
    } catch(e) {}
    return false;
  });
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdminLogin) return;
    const t = setTimeout(() => {
      try {
        if (emailRef.current) { emailRef.current.value = ''; setEmail(''); }
        if (passwordRef.current) { passwordRef.current.value = ''; setPassword(''); }
      } catch(e) { /* ignore */ }
    }, 50);
    return () => clearTimeout(t);
  }, [isAdminLogin]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); 
    setErr(null);
    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      localStorage.setItem('pundra_token', res.data.token);
      localStorage.setItem('pundra_user', JSON.stringify(res.data.user));
      try {
        if (typeof navigator !== 'undefined' && navigator.credentials && navigator.credentials.store) {
          try {
            if ((window as any).PasswordCredential) {
              const cred = new (window as any).PasswordCredential({ id: email, password });
              await navigator.credentials.store(cred);
            } else {
              await navigator.credentials.store({ id: email, password } as any);
            }
          } catch(e) { /* ignore */ }
        }
      } catch(e) { /* ignore */ }
      if (res.data.user && res.data.user.isAdmin) window.location.href = '/admin';
      else window.location.href = '/profile';
    } catch(e: any) { 
      setErr(e.response?.data?.error || 'Login failed'); 
    }
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

          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Link href="/register" passHref legacyBehavior>
              <MuiLink underline="hover" sx={{ fontSize: '0.95rem' }}>
                Create new account
              </MuiLink>
            </Link>
            <Link href="/admin-login" passHref legacyBehavior>
              <MuiLink underline="hover" color="secondary" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                Admin login
              </MuiLink>
            </Link>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
