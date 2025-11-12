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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Edit as EditIcon,
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    studentId: '',
    program: '',
    department: '',
    batch: '',
    session: '',
    bloodGroup: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('pundra_token');
    if (!t) {
      window.location.href = '/login';
      return;
    }

    (async () => {
      try {
        const me = await axios.get('http://localhost:3000/api/users/me', {
          headers: { Authorization: `Bearer ${t}` },
        });
        setUser(me.data.user);

        const q = await axios.get(`http://localhost:3000/api/users/${me.data.user.id}/qrcode-token`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        setToken(q.data.qrcodeToken);

        // Load attendance
        setLoadingAttendance(true);
        const att = await axios.get(`http://localhost:3000/api/attendance?userId=${me.data.user.id}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        setAttendance(att.data.rows || []);
      } catch (e: unknown) {
        if (axios.isAxiosError(e)) {
          const data = e.response?.data as { error?: string } | undefined;
          setErr(data?.error || e.message || 'Failed to load');
        } else if (e instanceof Error) {
          setErr(e.message);
        } else {
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

  const handleEditOpen = () => {
    if (user) {
      setEditForm({
        name: user.name || '',
        studentId: user.studentId || '',
        program: user.program || '',
        department: user.department || '',
        batch: user.batch || '',
        session: user.session || '',
        bloodGroup: user.bloodGroup || '',
      });
      setEditDialogOpen(true);
      setSaveError('');
    }
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSaveError('');
  };

  const handleEditSave = async () => {
    setSaving(true);
    setSaveError('');
    
    try {
      const t = localStorage.getItem('pundra_token');
      const res = await axios.put(
        'http://localhost:3000/api/users/me',
        editForm,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      
      setUser(res.data.user);
      localStorage.setItem('pundra_user', JSON.stringify(res.data.user));
      setEditDialogOpen(false);
    } catch (e: unknown) {
      console.error('Update error:', e);
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { error?: string } | undefined;
        setSaveError(data?.error || e.message || 'Failed to update profile');
      } else if (e instanceof Error) {
        setSaveError(e.message);
      } else {
        setSaveError('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = user?.email === 'admin@pundra.edu' || user?.isAdmin;

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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h4" fontWeight={700}>
                    {user.name}
                  </Typography>
                  {isSuperAdmin && (
                    <Tooltip title="Edit Profile">
                      <IconButton onClick={handleEditOpen} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>

                <Divider sx={{ my: 3 }} />

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
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Your Digital ID (QR)
            </Typography>
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

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {saveError && (
              <Alert severity="error" onClose={() => setSaveError('')}>
                {saveError}
              </Alert>
            )}
            <TextField
              label="Name"
              fullWidth
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
            <TextField
              label="Student ID"
              fullWidth
              value={editForm.studentId}
              onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
            />
            <TextField
              label="Program"
              fullWidth
              value={editForm.program}
              onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
            />
            <TextField
              label="Department"
              fullWidth
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
            />
            <TextField
              label="Batch"
              fullWidth
              value={editForm.batch}
              onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
            />
            <TextField
              label="Session"
              fullWidth
              value={editForm.session}
              onChange={(e) => setEditForm({ ...editForm, session: e.target.value })}
            />
            <TextField
              label="Blood Group"
              fullWidth
              value={editForm.bloodGroup}
              onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
              placeholder="e.g., A+, B-, O+"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleEditSave} variant="contained" disabled={saving || !editForm.name.trim()}>
            {saving ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
