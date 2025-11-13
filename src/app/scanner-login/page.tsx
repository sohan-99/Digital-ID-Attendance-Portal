'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  QrCodeScanner as ScannerIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const locations = [
  { value: 'All', label: '🌟 All Locations', color: '#9c27b0' },
  { value: 'Campus', label: '🏫 Campus', color: '#1976d2' },
  { value: 'Library', label: '📚 Library', color: '#2e7d32' },
  { value: 'Event', label: '🎉 Event', color: '#ed6c02' },
];

export default function ScannerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for session expired message
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'session_expired') {
        setError('Your session has expired. Please login again.');
        // Remove the error parameter from URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!location) {
      setError('Please select a location');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('/api/scanner/auth/login', {
        username,
        password,
        location,
      });

      // Save scanner admin token and data
      localStorage.setItem('scanner_token', res.data.token);
      localStorage.setItem('scanner_admin', JSON.stringify(res.data.scannerAdmin));

      // Dispatch event to update navbar
      window.dispatchEvent(new Event('authChange'));

      // Redirect to scanner dashboard
      router.push('/scanner-dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { error?: string } | undefined;
        setError(data?.error || 'Login failed. Please check your credentials.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedLocation = locations.find(loc => loc.value === location);

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            border: '2px solid',
            borderColor: selectedLocation?.color || 'primary.main',
            transition: 'border-color 0.3s ease',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: selectedLocation?.color || 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2,
                transition: 'background-color 0.3s ease',
              }}
            >
              <ScannerIcon sx={{ fontSize: 50, color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Scanner Admin Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access the attendance scanning system
            </Typography>
            <Chip
              icon={<LocationIcon />}
              label="Location-Based Access"
              size="small"
              sx={{ mt: 1 }}
              color="primary"
            />
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                select
                fullWidth
                label="Scanner Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText="Select your assigned scanning location"
              >
                {locations.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: option.color,
                        }}
                      />
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Alert severity="info" icon={<ScannerIcon />} sx={{ borderRadius: 2 }}>
                This portal is for authorized scanner administrators only.
              </Alert>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<ScannerIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  bgcolor: selectedLocation?.color,
                  '&:hover': {
                    bgcolor: selectedLocation?.color,
                    filter: 'brightness(0.9)',
                  },
                }}
              >
                {loading ? 'Logging in...' : 'Access Scanner'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              <strong>Default Credentials:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Campus: campus_scanner / Campus@2025
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Library: library_scanner / Library@2025
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Event: event_scanner / Event@2025
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
