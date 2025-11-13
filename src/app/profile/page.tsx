'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Container,
  TextField,
} from '@mui/material';
import {
  Download as DownloadIcon,
  CameraAlt as CameraIcon,
  Badge as BadgeIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarIcon,
  BloodtypeOutlined as BloodIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Groups as GroupsIcon,
  BusinessCenter as DepartmentIcon,
} from '@mui/icons-material';

// Helper to draw rounded rectangle on canvas
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  profilePicture?: string;
  studentId?: string;
  program?: string;
  department?: string;
  batch?: string;
  session?: string;
  bloodGroup?: string;
  emailVerified?: boolean;
}

interface AttendanceRecord {
  id: number;
  userId: number;
  location: string;
  scannedAt: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureError, setPictureError] = useState('');
  const [behaviorData, setBehaviorData] = useState<any>(null);
  const [loadingBehavior, setLoadingBehavior] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('pundra_token');
    console.log('[PROFILE] Token from localStorage:', t ? `${t.substring(0, 20)}...` : 'null');
    
    if (!t) {
      console.log('[PROFILE] No token found, redirecting to login');
      window.location.href = '/login';
      return;
    }

    (async () => {
      try {
        console.log('[PROFILE] Fetching user data...');
        const me = await axios.get('http://localhost:3000/api/users/me', {
          headers: { Authorization: `Bearer ${t}` },
        });
        console.log('[PROFILE] User data received:', me.data.user);
        setUser(me.data.user);

        // Only fetch QR token if email is verified or user is admin
        if (me.data.user.emailVerified || me.data.user.isAdmin) {
          const q = await axios.get(`http://localhost:3000/api/users/${me.data.user.id}/qrcode-token`, {
            headers: { Authorization: `Bearer ${t}` },
          });
          setToken(q.data.qrcodeToken);
        }

        // Load attendance
        setLoadingAttendance(true);
        const att = await axios.get(`http://localhost:3000/api/attendance?userId=${me.data.user.id}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        setAttendance(att.data.rows || []);

        // Load behavior analytics
        setLoadingBehavior(true);
        try {
          const behavior = await axios.get('http://localhost:3000/api/users/me/behavior', {
            headers: { Authorization: `Bearer ${t}` },
          });
          setBehaviorData(behavior.data);
        } catch (behaviorErr) {
          console.log('[PROFILE] Behavior analytics error:', behaviorErr);
        } finally {
          setLoadingBehavior(false);
        }
      } catch (e: unknown) {
        if (axios.isAxiosError(e)) {
          const data = e.response?.data as { error?: string } | undefined;
          const errorMsg = data?.error || e.message || 'Failed to load';
          
          console.log('[PROFILE] Error:', {
            status: e.response?.status,
            error: errorMsg,
            data: e.response?.data
          });
          
          // If unauthorized (401), clear token and redirect to login
          if (e.response?.status === 401) {
            console.log('[PROFILE] Unauthorized, clearing localStorage and redirecting');
            localStorage.removeItem('pundra_token');
            localStorage.removeItem('pundra_user');
            window.location.href = '/login?error=session_expired';
            return;
          }
          
          setErr(errorMsg);
        } else if (e instanceof Error) {
          console.log('[PROFILE] Error:', e.message);
          setErr(e.message);
        } else {
          console.log('[PROFILE] Unknown error:', e);
          setErr('Failed to load');
        }
      } finally {
        setLoadingAttendance(false);
      }
    })();
  }, []);

  async function handleProfilePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPictureError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPictureError('Image size must be less than 5MB');
      return;
    }

    setPictureError('');
    setUploadingPicture(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const t = localStorage.getItem('pundra_token');

        try {
          const res = await axios.put(
            'http://localhost:3000/api/users/me/profile-picture',
            { profilePicture: dataUrl },
            { headers: { Authorization: `Bearer ${t}` } }
          );
          setUser(res.data.user);
          const storedUser = JSON.parse(localStorage.getItem('pundra_user') || '{}');
          localStorage.setItem('pundra_user', JSON.stringify({ ...storedUser, profilePicture: dataUrl }));
        } catch (e: unknown) {
          console.error('Upload error:', e);
          if (axios.isAxiosError(e)) {
            const data = e.response?.data as { error?: string } | undefined;
            
            // If unauthorized (401), clear token and redirect to login
            if (e.response?.status === 401) {
              localStorage.removeItem('pundra_token');
              localStorage.removeItem('pundra_user');
              window.location.href = '/login?error=session_expired';
              return;
            }
            
            setPictureError(data?.error || e.message || 'Failed to upload picture');
          } else if (e instanceof Error) {
            setPictureError(e.message);
          } else {
            setPictureError('Failed to upload picture');
          }
        } finally {
          setUploadingPicture(false);
        }
      };
      reader.onerror = () => {
        setPictureError('Failed to read image file');
        setUploadingPicture(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Reader error:', error);
      setPictureError('Failed to process image file');
      setUploadingPicture(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setVerifyingOtp(true);

    try {
      const t = localStorage.getItem('pundra_token');
      const res = await axios.post(
        'http://localhost:3000/api/auth/verify-otp',
        { otp },
        { headers: { Authorization: `Bearer ${t}` } }
      );

      setOtpSuccess('Email verified successfully! Your QR code is now available.');
      setOtp('');
      
      // Update user state
      if (user) {
        const updatedUser = { ...user, emailVerified: true };
        setUser(updatedUser);
        localStorage.setItem('pundra_user', JSON.stringify(updatedUser));
      }

      // Set the QR token
      setToken(res.data.qrToken);
      
      // Reload page after 2 seconds to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string } | undefined;
        setOtpError(data?.error || 'Failed to verify OTP');
      } else {
        setOtpError('Failed to verify OTP');
      }
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleResendOtp() {
    setOtpError('');
    setOtpSuccess('');
    setResendingOtp(true);

    try {
      const t = localStorage.getItem('pundra_token');
      await axios.post(
        'http://localhost:3000/api/auth/resend-otp',
        {},
        { headers: { Authorization: `Bearer ${t}` } }
      );

      setOtpSuccess('New OTP sent to your email!');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string } | undefined;
        setOtpError(data?.error || 'Failed to resend OTP');
      } else {
        setOtpError('Failed to resend OTP');
      }
    } finally {
      setResendingOtp(false);
    }
  }

  async function downloadQR() {
    if (!token) {
      alert('No token available');
      return;
    }
    try {
      const qrcode = await import('qrcode');
      const size = 800;
      const qrDataUrl = await qrcode.default.toDataURL(token, { width: size, margin: 1 });
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((res, rej) => {
        qrImg.onload = res;
        qrImg.onerror = rej;
      });

      const logo = new Image();
      logo.src = '/qr-center.png';
      await new Promise((res) => {
        logo.onload = res;
        logo.onerror = res;
      });

      const canvas = document.createElement('canvas');
      canvas.width = qrImg.width;
      canvas.height = qrImg.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(qrImg, 0, 0);

      if (logo && logo.width) {
        const logoPercent = 0.16;
        const logoSize = Math.round(canvas.width * logoPercent);
        const x = Math.round((canvas.width - logoSize) / 2);
        const y = Math.round((canvas.height - logoSize) / 2);
        const r = 8;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, x - 6, y - 6, logoSize + 12, logoSize + 12, r);
        ctx.fill();
        ctx.drawImage(logo, x, y, logoSize, logoSize);
      }

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${user?.name || user?.email}_qrcode.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('download qr', e);
      alert('Failed to create QR image');
    }
  }

  if (err)
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{err}</Alert>
      </Container>
    );

  if (!user)
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Profile Card */}
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="flex-start">
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Avatar
                    src={user.profilePicture}
                    alt={user.name}
                    sx={{ width: 160, height: 160, fontSize: '4rem', bgcolor: 'primary.main' }}
                  >
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                  <Tooltip title="Change profile picture">
                    <IconButton
                      component="label"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                      disabled={uploadingPicture}
                    >
                      <input type="file" accept="image/*" hidden onChange={handleProfilePictureChange} />
                      <CameraIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                {uploadingPicture && <CircularProgress size={24} />}
                {pictureError && (
                  <Alert severity="error" sx={{ mt: 1, width: '100%' }}>
                    {pictureError}
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12} md={8}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {user.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>

                <Divider sx={{ my: 3 }} />

                {/* Hide student details for admin users */}
                {!user.isAdmin && (
                  <Grid container spacing={2}>
                    {user.studentId && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BadgeIcon color="primary" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Student ID
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {user.studentId}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {user.program && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon color="primary" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Program
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {user.program}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {user.department && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DepartmentIcon color="primary" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Department
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {user.department}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {user.batch && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GroupsIcon color="primary" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Batch
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {user.batch}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {user.session && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon color="primary" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Session
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {user.session}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {user.bloodGroup && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BloodIcon color="primary" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Blood Group
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {user.bloodGroup}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                )}

                {/* Show admin badge for admin users */}
                {user.isAdmin && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h6" color="primary" fontWeight={600}>
                      Administrator
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Behavior Analysis Card */}
        {!user.isAdmin && behaviorData && behaviorData.behavior && (
          <Card 
            elevation={3} 
            sx={{ 
              bgcolor: 
                behaviorData.behavior.category === 'Regular' ? '#e8f5e9' :
                behaviorData.behavior.category === 'Less Regular' ? '#fff3e0' :
                behaviorData.behavior.category === 'Irregular' ? '#ffe0b2' : '#ffebee',
              border: 2,
              borderColor:
                behaviorData.behavior.category === 'Regular' ? '#4caf50' :
                behaviorData.behavior.category === 'Less Regular' ? '#ff9800' :
                behaviorData.behavior.category === 'Irregular' ? '#ff5722' : '#f44336'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom color="primary">
                📊 Your Attendance Behavior
              </Typography>
              <Alert 
                severity={
                  behaviorData.behavior.category === 'Regular' ? 'success' :
                  behaviorData.behavior.category === 'Less Regular' ? 'warning' :
                  behaviorData.behavior.category === 'Irregular' ? 'warning' : 'error'
                }
                sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 600 }}
              >
                {behaviorData.behavior.message}
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {behaviorData.behavior.onTimeCount}
                    </Typography>
                    <Typography variant="caption">✅ On Time</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {behaviorData.behavior.slightlyLateCount}
                    </Typography>
                    <Typography variant="caption">⚠️ Slightly Late</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {behaviorData.behavior.lateCount}
                    </Typography>
                    <Typography variant="caption">⏰ Late</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                    <Typography variant="h4" fontWeight="bold" color="error.dark">
                      {behaviorData.behavior.veryLateCount}
                    </Typography>
                    <Typography variant="caption">❌ Very Late</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {behaviorData.behavior.score}/100
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your Attendance Behavior Score
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* QR Code Card or OTP Verification Card */}
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Your Digital ID (QR)
            </Typography>
            
            {/* Show OTP verification for non-admin users with unverified email */}
            {!user.isAdmin && !user.emailVerified ? (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Please verify your email to access your QR code. We've sent a verification code to <strong>{user.email}</strong>
                </Alert>
                
                <Box component="form" onSubmit={handleVerifyOtp} sx={{ maxWidth: 500, mx: 'auto' }}>
                  <Stack spacing={2}>
                    <TextField
                      label="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                      fullWidth
                      inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
                      disabled={verifyingOtp}
                    />
                    
                    {otpError && <Alert severity="error">{otpError}</Alert>}
                    {otpSuccess && <Alert severity="success">{otpSuccess}</Alert>}
                    
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={verifyingOtp || otp.length !== 6}
                    >
                      {verifyingOtp ? <CircularProgress size={24} /> : 'Verify Email'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="medium"
                      fullWidth
                      onClick={handleResendOtp}
                      disabled={resendingOtp}
                    >
                      {resendingOtp ? <CircularProgress size={20} /> : 'Resend OTP'}
                    </Button>
                    
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      OTP is valid for 15 minutes. If you didn't receive it, check your spam folder or click resend.
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            ) : (
              /* Show QR code for verified users and admins */
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <QRCodeDisplay token={token ?? undefined} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Use this QR code for attendance scanning at lecture halls, library, and campus events.
                  </Typography>
                  <Button variant="contained" startIcon={<DownloadIcon />} onClick={downloadQR} size="large" fullWidth>
                    Download QR Code
                  </Button>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Attendance History Card */}
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Attendance History
            </Typography>
            {loadingAttendance ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : !attendance || attendance.length === 0 ? (
              <Alert severity="info">No attendance records found.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Date</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Time</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Location</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.map((a) => {
                      const dt = new Date(a.scannedAt);
                      const date = dt.toLocaleDateString();
                      const time = dt.toLocaleTimeString();
                      return (
                        <TableRow key={a.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon fontSize="small" color="action" />
                              {date}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimeIcon fontSize="small" color="action" />
                              {time}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationIcon fontSize="small" color="action" />
                              {a.location || '—'}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
