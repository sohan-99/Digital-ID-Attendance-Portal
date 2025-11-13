'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode2 as QrCodeIcon,
} from '@mui/icons-material';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

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

interface Stats {
  totalUsers: number;
  totalAttendance: number;
  error?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
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
  scannerLocation?: string;
  scannedAt: string;
  user?: User;
}

export default function AdminPage() {
  const SUPER_ADMIN_EMAIL = 'admin@pundra.edu';

  // State for stats
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalAttendance: 0 });

  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    program: '',
    department: '',
    batch: '',
    sessionSemester: '',
    sessionYear: '',
    bloodGroup: '',
    isAdmin: false,
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    studentId: '',
    program: '',
    department: '',
    batch: '',
    sessionSemester: '',
    sessionYear: '',
    bloodGroup: '',
    isAdmin: false,
  });

  // State for attendance
  const [dailyMap, setDailyMap] = useState<Record<string, AttendanceRecord[]>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [onlyDaysWithScans, setOnlyDaysWithScans] = useState(true);

  // State for department analytics
  const [departmentData, setDepartmentData] = useState<{
    labels: string[];
    counts: number[];
  }>({ labels: [], counts: [] });

  // State for charts
  const [chartDays, setChartDays] = useState(7);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [chartData, setChartData] = useState<{
    labels: string[];
    scanCounts: number[];
    uniqueUserCounts: number[];
  }>({ labels: [], scanCounts: [], uniqueUserCounts: [] });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadChartData = useCallback((days: number) => {
    const token = localStorage.getItem('pundra_token');
    if (!token) return;

    axios
      .get(`http://localhost:3000/api/admin/attendance/daily?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        setChartData({
          labels: data.labels || [],
          scanCounts: data.scanCounts || [],
          uniqueUserCounts: data.uniqueUserCounts || [],
        });
      })
      .catch((err) => console.error(err));
  }, []);

  const loadDepartmentData = useCallback(() => {
    const token = localStorage.getItem('pundra_token');
    if (!token) return;

    axios
      .get('http://localhost:3000/api/admin/attendance/by-department', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        setDepartmentData({
          labels: data.labels || [],
          counts: data.counts || [],
        });
      })
      .catch((err) => console.error(err));
  }, []);

  const loadDailyAttendance = useCallback(() => {
    const token = localStorage.getItem('pundra_token');
    if (!token) return;

    axios
      .get('http://localhost:3000/api/admin/attendance/daily?days=30', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        if (data.daily) {
          setDailyMap(data.daily);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Function to refresh all data
  const refreshAllData = useCallback(() => {
    const token = localStorage.getItem('pundra_token');
    if (!token) return;

    // Fetch stats
    axios
      .get('http://localhost:3000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error(err);
      });

    // Fetch users
    axios
      .get('http://localhost:3000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUsers(Array.isArray(res.data.users) ? res.data.users : []);
      })
      .catch((err) => {
        console.error(err);
      });

    // Reload chart data
    loadChartData(chartDays);
    loadDepartmentData();
    loadDailyAttendance();
    
    setLastRefresh(new Date());
  }, [chartDays, loadChartData, loadDepartmentData, loadDailyAttendance]);

  useEffect(() => {
    const token = localStorage.getItem('pundra_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Initial data load
    refreshAllData();

    // Set up auto-refresh interval (every 5 seconds)
    const intervalId = setInterval(() => {
      if (autoRefresh) {
        refreshAllData();
      }
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshAllData]); // Re-run if autoRefresh changes

  const createUser = () => {
    const token = localStorage.getItem('pundra_token');
    if (!token) return;

    const { name, email, password, studentId, program, department, batch, sessionSemester, sessionYear, bloodGroup, isAdmin } = createForm;

    if (!name || !email || !password) {
      setErrorMsg('Name, email, and password are required');
      setSuccessMsg('');
      return;
    }

    const session = sessionSemester && sessionYear ? `${sessionSemester} ${sessionYear}` : '';

    axios
      .post(
        'http://localhost:3000/api/admin/users',
        { name, email, password, studentId, program, department, batch, session, bloodGroup, isAdmin },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setUsers([...users, res.data]);
        setSuccessMsg('User created successfully');
        setErrorMsg('');
        setShowCreateUser(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          studentId: '',
          program: '',
          department: '',
          batch: '',
          sessionSemester: '',
          sessionYear: '',
          bloodGroup: '',
          isAdmin: false,
        });
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.response?.data?.error || 'Failed to create user');
        setSuccessMsg('');
      });
  };

  const editUser = (userId: number) => {
    const token = localStorage.getItem('pundra_token');
    if (!token) return;

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (user.email === SUPER_ADMIN_EMAIL) {
      setErrorMsg('Cannot edit super admin');
      setSuccessMsg('');
      return;
    }

    const { name, email, studentId, program, department, batch, sessionSemester, sessionYear, bloodGroup, isAdmin } = editForm;

    if (!name || !email) {
      setErrorMsg('Name and email are required');
      setSuccessMsg('');
      return;
    }

    const session = sessionSemester && sessionYear ? `${sessionSemester} ${sessionYear}` : '';

    axios
      .put(
        `http://localhost:3000/api/admin/users/${userId}`,
        { name, email, studentId, program, department, batch, session, bloodGroup, isAdmin },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setUsers(users.map((u) => (u.id === userId ? res.data : u)));
        setSuccessMsg('User updated successfully');
        setErrorMsg('');
        setEditUserId(null);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.response?.data?.error || 'Failed to update user');
        setSuccessMsg('');
      });
  };

  const deleteUser = (userId: number) => {
    const token = localStorage.getItem('pundra_token');
    if (!token) return;

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (user.email === SUPER_ADMIN_EMAIL) {
      setErrorMsg('Cannot delete super admin');
      setSuccessMsg('');
      return;
    }

    if (!confirm(`Delete user ${user.name}?`)) return;

    axios
      .delete(`http://localhost:3000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setUsers(users.filter((u) => u.id !== userId));
        setSuccessMsg('User deleted successfully');
        setErrorMsg('');
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.response?.data?.error || 'Failed to delete user');
        setSuccessMsg('');
      });
  };

  const downloadUserQr = async (userId: number) => {
    const token = localStorage.getItem('pundra_token');
    if (!token) return;

    try {
      const res = await axios.get(`http://localhost:3000/api/users/${userId}/qrcode-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const qrToken = res.data.qrcodeToken;

      const QRCode = (await import('qrcode')).default;
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrToken, { width: 300 });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const logoSize = 300 * 0.18;
        const logoX = (300 - logoSize) / 2;
        const logoY = (300 - logoSize) / 2;

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, logoX - 4, logoY - 4, logoSize + 8, logoSize + 8, 8);
        ctx.fill();

        const logo = new Image();
        logo.onload = () => {
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `qrcode-${userId}.png`;
          a.click();
        };
        logo.src = '/logo.png';
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to download QR code');
      setSuccessMsg('');
    }
  };

  const exportAttendanceCSV = () => {
    const token = localStorage.getItem('pundra_token');
    if (!token) return;

    axios
      .get('http://localhost:3000/api/admin/export-attendance', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance.csv';
        a.click();
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg('Failed to export attendance');
        setSuccessMsg('');
      });
  };

  const loadDayWiseAttendance = () => {
    const token = localStorage.getItem('pundra_token');
    if (!token) return;

    axios
      .get('http://localhost:3000/api/admin/attendance/daily?days=90', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        const dayMap: Record<string, AttendanceRecord[]> = {};

        if (data.dailyRecords && Array.isArray(data.dailyRecords)) {
          data.dailyRecords.forEach((record: AttendanceRecord) => {
            const date = new Date(record.scannedAt).toLocaleDateString();
            if (!dayMap[date]) dayMap[date] = [];
            dayMap[date].push(record);
          });
        }

        setDailyMap(dayMap);
      })
      .catch((err) => console.error(err));
  };

  const toggleDay = (day: string) => {
    setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const expandAll = () => {
    const newExpanded: Record<string, boolean> = {};
    Object.keys(dailyMap).forEach((day) => {
      newExpanded[day] = true;
    });
    setExpandedDays(newExpanded);
  };

  const collapseAll = () => {
    setExpandedDays({});
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Attendance Analytics (Last ${chartDays} Days)`,
      },
    },
  };

  const chartDataset = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Total Scans',
        data: chartData.scanCounts,
        backgroundColor: 'rgba(102, 126, 234, 0.5)',
        borderColor: 'rgb(102, 126, 234)',
        borderWidth: 1,
      },
      {
        label: 'Unique Users',
        data: chartData.uniqueUserCounts,
        backgroundColor: 'rgba(118, 75, 162, 0.5)',
        borderColor: 'rgb(118, 75, 162)',
        borderWidth: 1,
      },
    ],
  };

  const deptChartData = {
    labels: departmentData.labels,
    datasets: [
      {
        label: 'Attendance Count',
        data: departmentData.counts,
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const daysToShow = onlyDaysWithScans
    ? Object.keys(dailyMap).filter((day) => dailyMap[day].length > 0)
    : Object.keys(dailyMap);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" color="primary">
          Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-refresh (5s)"
          />
          <Button
            variant="outlined"
            size="small"
            onClick={refreshAllData}
          >
            Refresh Now
          </Button>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Total Users
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {stats.totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Total Attendance Records
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {stats.totalAttendance}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart Analytics */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Attendance Analytics
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <FormControl size="small">
            <InputLabel>Days</InputLabel>
            <Select
              value={chartDays}
              label="Days"
              onChange={(e) => {
                const days = Number(e.target.value);
                setChartDays(days);
                loadChartData(days);
              }}
            >
              <MenuItem value={7}>7 Days</MenuItem>
              <MenuItem value={14}>14 Days</MenuItem>
              <MenuItem value={30}>30 Days</MenuItem>
              <MenuItem value={90}>90 Days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={chartType}
              label="Chart Type"
              onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
            >
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="line">Line Chart</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        {chartType === 'bar' ? (
          <Bar options={chartOptions} data={chartDataset} />
        ) : (
          <Line options={chartOptions} data={chartDataset} />
        )}
      </Paper>

      {/* Department Analytics */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Attendance by Department
        </Typography>
        <Bar
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' as const },
              title: { display: true, text: 'Total Attendance by Department' },
            },
          }}
          data={deptChartData}
        />
      </Paper>

      {/* User Management */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          User Management
        </Typography>
        <Button variant="contained" onClick={() => setShowCreateUser(!showCreateUser)} sx={{ mb: 2 }}>
          {showCreateUser ? 'Cancel' : 'Create User'}
        </Button>

        <Collapse in={showCreateUser}>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Create New User
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Student ID"
                  value={createForm.studentId}
                  onChange={(e) => setCreateForm({ ...createForm, studentId: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Program"
                  value={createForm.program}
                  onChange={(e) => setCreateForm({ ...createForm, program: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Batch"
                  value={createForm.batch}
                  onChange={(e) => setCreateForm({ ...createForm, batch: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Session Semester</InputLabel>
                  <Select
                    value={createForm.sessionSemester}
                    label="Session Semester"
                    onChange={(e) => setCreateForm({ ...createForm, sessionSemester: e.target.value })}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="Spring">Spring</MenuItem>
                    <MenuItem value="Summer">Summer</MenuItem>
                    <MenuItem value="Fall">Fall</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Session Year"
                  value={createForm.sessionYear}
                  onChange={(e) => setCreateForm({ ...createForm, sessionYear: e.target.value })}
                  placeholder="2024"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Blood Group</InputLabel>
                  <Select
                    value={createForm.bloodGroup}
                    label="Blood Group"
                    onChange={(e) => setCreateForm({ ...createForm, bloodGroup: e.target.value })}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                    <MenuItem value="AB-">AB-</MenuItem>
                    <MenuItem value="O+">O+</MenuItem>
                    <MenuItem value="O-">O-</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={createForm.isAdmin}
                      onChange={(e) => setCreateForm({ ...createForm, isAdmin: e.target.checked })}
                    />
                  }
                  label="Admin User"
                />
              </Grid>
            </Grid>
            <Button variant="contained" color="primary" onClick={createUser} sx={{ mt: 2 }}>
              Create User
            </Button>
          </Box>
        </Collapse>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Serial</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Program</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {editUserId === user.id ? (
                      <TextField
                        size="small"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      user.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editUserId === user.id ? (
                      <TextField
                        size="small"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    ) : (
                      user.email
                    )}
                  </TableCell>
                  <TableCell>
                    {editUserId === user.id ? (
                      <TextField
                        size="small"
                        value={editForm.studentId}
                        onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                      />
                    ) : (
                      user.studentId || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editUserId === user.id ? (
                      <TextField
                        size="small"
                        value={editForm.program}
                        onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                      />
                    ) : (
                      user.program || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editUserId === user.id ? (
                      <TextField
                        size="small"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      />
                    ) : (
                      user.department || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editUserId === user.id ? (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editForm.isAdmin}
                            onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
                          />
                        }
                        label="Admin"
                      />
                    ) : (
                      <Chip label={user.isAdmin ? 'Admin' : 'User'} color={user.isAdmin ? 'primary' : 'default'} size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {editUserId === user.id ? (
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" onClick={() => editUser(user.id)}>
                          Save
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => setEditUserId(null)}>
                          Cancel
                        </Button>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            const session = user.session?.split(' ') || [];
                            setEditForm({
                              name: user.name,
                              email: user.email,
                              studentId: user.studentId || '',
                              program: user.program || '',
                              department: user.department || '',
                              batch: user.batch || '',
                              sessionSemester: session[0] || '',
                              sessionYear: session[1] || '',
                              bloodGroup: user.bloodGroup || '',
                              isAdmin: user.isAdmin,
                            });
                            setEditUserId(user.id);
                          }}
                          disabled={user.email === SUPER_ADMIN_EMAIL}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteUser(user.id)}
                          disabled={user.email === SUPER_ADMIN_EMAIL}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <IconButton size="small" color="secondary" onClick={() => downloadUserQr(user.id)}>
                          <QrCodeIcon />
                        </IconButton>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Day-wise Attendance */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Day-wise Attendance
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={loadDayWiseAttendance}>
            Load Last 90 Days
          </Button>
          <Button variant="outlined" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outlined" onClick={collapseAll}>
            Collapse All
          </Button>
          <FormControlLabel
            control={
              <Checkbox checked={onlyDaysWithScans} onChange={(e) => setOnlyDaysWithScans(e.target.checked)} />
            }
            label="Only days with scans"
          />
        </Stack>

        {daysToShow.length === 0 && <Typography>No data available. Click &ldquo;Load Last 90 Days&rdquo; to fetch data.</Typography>}

        {daysToShow.map((day) => (
          <Box key={day} sx={{ mb: 2 }}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 1,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onClick={() => toggleDay(day)}
            >
              <Typography variant="h6">
                {day} ({dailyMap[day].length} scans)
              </Typography>
              <IconButton color="inherit">{expandedDays[day] ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
            </Box>
            <Collapse in={expandedDays[day]}>
              <TableContainer sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyMap[day].map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.id}</TableCell>
                        <TableCell>{record.user?.name || `User ${record.userId}`}</TableCell>
                        <TableCell>{record.scannerLocation || record.location}</TableCell>
                        <TableCell>{new Date(record.scannedAt).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Box>
        ))}
      </Paper>

      {/* Export */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Export Data
        </Typography>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportAttendanceCSV}>
          Export Attendance CSV
        </Button>
      </Paper>
    </Container>
  );
}
