'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  QrCodeScanner as ScannerIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

interface ScannerAdmin {
  id: number;
  username: string;
  location: string;
  name: string;
}

interface Attendance {
  id: number;
  userId: number;
  scannedAt: string;
  scannerLocation: string;
  user?: {
    name: string;
    email: string;
    studentId?: string;
    department?: string;
  };
}

const locationColors: Record<string, string> = {
  Campus: '#1976d2',
  Library: '#2e7d32',
  Event: '#ed6c02',
};

const locationEmojis: Record<string, string> = {
  Campus: '🏫',
  Library: '📚',
  Event: '🎉',
};

export default function ScannerDashboard() {
  const router = useRouter();
  const [scannerAdmin, setScannerAdmin] = useState<ScannerAdmin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = useCallback(() => {
    localStorage.removeItem('scanner_token');
    localStorage.removeItem('scanner_admin');
    window.dispatchEvent(new Event('authChange'));
    router.push('/scanner-login');
  }, [router]);

  const loadAttendance = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const [allRes, todayRes] = await Promise.all([
        axios.get('/api/scanner/attendance', {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get('/api/scanner/attendance?today=true', {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      setAttendance(allRes.data.records || []);
      setTodayCount(todayRes.data.count || 0);
    } catch (error) {
      console.error('Error loading attendance:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const storedToken = localStorage.getItem('scanner_token');
    const storedAdmin = localStorage.getItem('scanner_admin');

    if (!storedToken || !storedAdmin) {
      router.push('/scanner-login');
      return;
    }

    try {
      const adminData = JSON.parse(storedAdmin);
      setScannerAdmin(adminData);
      setToken(storedToken);
      loadAttendance(storedToken);
    } catch (e) {
      console.error('Error parsing scanner admin data:', e);
      router.push('/scanner-login');
    }
  }, [router, loadAttendance]);

  const filteredAttendance = attendance.filter(att => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      att.user?.name?.toLowerCase().includes(query) ||
      att.user?.email?.toLowerCase().includes(query) ||
      att.user?.studentId?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!scannerAdmin) {
    return null;
  }

  const locationColor = locationColors[scannerAdmin.location] || '#1976d2';
  const locationEmoji = locationEmojis[scannerAdmin.location] || '📍';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Paper elevation={3} sx={{ p: 3, borderTop: `4px solid ${locationColor}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {locationEmoji} {scannerAdmin.location} Scanner
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome, {scannerAdmin.name}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => token && loadAttendance(token)}>
                Refresh
              </Button>
              <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ bgcolor: `${locationColor}20`, p: 2, borderRadius: 2 }}>
                    <PeopleIcon sx={{ fontSize: 40, color: locationColor }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>{todayCount}</Typography>
                    <Typography variant="body2" color="text.secondary">Today&apos;s Scans</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ bgcolor: '#2e7d3220', p: 2, borderRadius: 2 }}>
                    <LocationIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{scannerAdmin.location}</Typography>
                    <Typography variant="body2" color="text.secondary">Location</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ bgcolor: '#ed6c0220', p: 2, borderRadius: 2 }}>
                    <TimeIcon sx={{ fontSize: 40, color: '#ed6c02' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{new Date().toLocaleDateString()}</Typography>
                    <Typography variant="body2" color="text.secondary">Current Date</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: `${locationColor}10` }}>
          <ScannerIcon sx={{ fontSize: 60, color: locationColor, mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            QR Scanner Integration
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Use the /scanner page or integrate a QR scanning device for attendance tracking.
            Your location <strong>{scannerAdmin.location}</strong> will be automatically selected when you access the scanner.
          </Typography>
          <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Note:</strong> When you click &ldquo;Go to Scanner Page&rdquo;, your location ({scannerAdmin.location}) 
              will be automatically selected in the dropdown menu. You can change it if needed.
            </Typography>
          </Alert>
          <Button variant="contained" size="large" startIcon={<ScannerIcon />} href="/scanner"
            sx={{ bgcolor: locationColor, '&:hover': { bgcolor: locationColor, filter: 'brightness(0.9)' } }}>
            Go to Scanner Page
          </Button>
        </Paper>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>Recent Scans</Typography>
            <TextField size="small" placeholder="Search students..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
          </Box>

          {filteredAttendance.length === 0 ? (
            <Alert severity="info">No attendance records found for this location.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Student Name</strong></TableCell>
                    <TableCell><strong>Student ID</strong></TableCell>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell><strong>Time</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAttendance.slice(0, 50).map((att) => (
                    <TableRow key={att.id} hover>
                      <TableCell>{att.user?.name || 'Unknown'}</TableCell>
                      <TableCell>{att.user?.studentId || 'N/A'}</TableCell>
                      <TableCell>{att.user?.department || 'N/A'}</TableCell>
                      <TableCell>{new Date(att.scannedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label="Scanned" color="success" size="small" icon={<CheckIcon />} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
