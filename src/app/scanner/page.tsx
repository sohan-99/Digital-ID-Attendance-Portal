'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Stack,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Fade,
  Snackbar,
} from '@mui/material';
import {
  QrCodeScanner as QrIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Videocam as VideocamIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';

export default function Scanner() {
  const [msg, setMsg] = useState('');
  const [running, setRunning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'info' | 'success' | 'error' });
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [selectedCamera, setSelectedCamera] = useState('');
  const cooldownRef = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('pundra_token');
    if (!t) {
      window.location.href = '/login';
      return;
    }
    
    // Check if user is admin
    axios
      .get('/api/users/me', {
        headers: { Authorization: `Bearer ${t}` },
      })
      .then((res) => {
        if (res.data.user.isAdmin) {
          setIsAdmin(true);
          setIsAuthenticated(true);
        } else {
          // Regular users cannot access scanner
          window.location.href = '/profile';
        }
      })
      .catch((err) => {
        console.error('Auth check failed:', err);
        window.location.href = '/login';
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, []);

  useEffect(() => {
    async function listCams() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === 'videoinput');
        setCameras(cams);
        if (cams.length > 0) setSelectedCamera(cams[0].deviceId);
      } catch (e) {
        console.error('enumerateDevices failed', e);
        setMsg('Unable to list camera devices');
      }
    }
    listCams();
  }, []);

  async function start(deviceId: string) {
    try {
      setMsg('Requesting camera access...');
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);
      setMsg('Camera active - Position QR code in frame');
      startLoop();
    } catch (err) {
      console.error('getUserMedia error', err);
      setMsg('Camera access denied or not available');
      setRunning(false);
      showToast('Camera access denied or not available', 'error');
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setRunning(false);
    setMsg('Scanner stopped');
  }

  async function startLoop() {
    const jsqrModule = await import('jsqr');
    const jsQR = jsqrModule.default || jsqrModule;

    const loop = () => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
          const w = (canvas.width = video.videoWidth);
          const h = (canvas.height = video.videoHeight);
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(video, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const code = jsQR(imageData.data, w, h);
          if (code) {
            if (!cooldownRef.current) {
              cooldownRef.current = true;
              setMsg('QR Code detected - Verifying...');
              const token = localStorage.getItem('pundra_token');
              axios
                .post(
                  '/api/attendance/scan',
                  { token: code.data, location: 'Camera/Scanner' },
                  { headers: { Authorization: `Bearer ${token}` } }
                )
                .then(() => {
                  setMsg('Attendance recorded successfully!');
                  showToast('✓ Attendance recorded successfully!', 'success', true);
                  setTimeout(() => stop(), 1500);
                })
                .catch((e: unknown) => {
                  console.error('verify error', e);
                  let errMsg = 'Verification failed';
                  if (axios.isAxiosError(e)) {
                    const data = e.response?.data as { error?: string } | undefined;
                    errMsg = data?.error ?? e.message ?? errMsg;
                  } else if (e instanceof Error) {
                    errMsg = e.message || errMsg;
                  } else if (typeof e === 'object' && e !== null) {
                    try {
                      errMsg = String(e);
                    } catch {
                      /* ignore */
                    }
                  }
                  setMsg(errMsg);
                  showToast(errMsg, 'error');
                })
                .finally(() => {
                  setTimeout(() => {
                    cooldownRef.current = false;
                    if (running) setMsg('Ready for next scan');
                  }, 2000);
                });
            }
          }
        }
      } catch (e) {
        console.debug('scan loop error', e);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  function showToast(message: string, type: 'info' | 'success' | 'error' = 'info', sticky = false) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message, type});
    const delay = sticky ? 5000 : 3000;
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
      toastTimerRef.current = null;
    }, delay);
  }

  function hideToast() {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast((t) => ({ ...t, visible: false }));
  }

  if (isChecking) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Verifying access...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Stack spacing={4} sx={{ py: 4 }}>
        {/* Header Card */}
        <Card elevation={3}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2,
              }}
            >
              <QrIcon sx={{ fontSize: 50, color: 'primary.dark' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              QR Code Scanner
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Scan student QR codes for instant attendance tracking
            </Typography>
          </CardContent>
        </Card>

        {/* Scanner Control Card */}
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              {/* Camera Selection */}
              <FormControl fullWidth>
                <InputLabel id="camera-select-label">Select Camera</InputLabel>
                <Select
                  labelId="camera-select-label"
                  value={selectedCamera}
                  label="Select Camera"
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  disabled={running}
                  startAdornment={<CameraIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {cameras.length === 0 && <MenuItem value="">Loading cameras...</MenuItem>}
                  {cameras.map((c) => (
                    <MenuItem key={c.deviceId} value={c.deviceId}>
                      {c.label || `Camera ${c.deviceId.substring(0, 8)}...`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Control Buttons */}
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={running ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                  onClick={() => start(selectedCamera)}
                  disabled={running || !selectedCamera}
                  sx={{ minWidth: 150 }}
                >
                  {running ? 'Scanning...' : 'Start Scanner'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  startIcon={<StopIcon />}
                  onClick={stop}
                  disabled={!running}
                  sx={{ minWidth: 150 }}
                >
                  Stop
                </Button>
              </Stack>

              {/* Status Message */}
              {msg && (
                <Fade in={Boolean(msg)}>
                  <Alert
                    severity={
                      msg.includes('success') || msg.includes('recorded')
                        ? 'success'
                        : msg.includes('denied') || msg.includes('failed') || msg.includes('Error')
                        ? 'error'
                        : msg.includes('Verifying') || msg.includes('detected')
                        ? 'warning'
                        : 'info'
                    }
                    icon={
                      msg.includes('success') || msg.includes('recorded') ? (
                        <CheckIcon />
                      ) : msg.includes('denied') || msg.includes('failed') ? (
                        <ErrorIcon />
                      ) : running ? (
                        <VideocamIcon />
                      ) : (
                        <QrIcon />
                      )
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    {msg}
                  </Alert>
                </Fade>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Video Preview Card */}
        <Card elevation={4}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <Box
              sx={{
                position: 'relative',
                bgcolor: 'black',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: selectedCamera ? 'pointer' : 'default',
                '&:hover': selectedCamera
                  ? {
                      '& .camera-inactive-overlay': {
                        bgcolor: 'rgba(0,0,0,0.85)',
                      },
                      '& .video-overlay-hint': {
                        opacity: 1,
                      },
                    }
                  : {},
              }}
              onClick={() => {
                if (!selectedCamera) return;
                if (running) {
                  stop();
                } else {
                  start(selectedCamera);
                }
              }}
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '500px',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  display: 'block',
                }}
              />

              {/* Hidden Canvas */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Scanning Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  {/* Scanning Frame */}
                  <Box
                    sx={{
                      width: 280,
                      height: 280,
                      border: '4px dashed',
                      borderColor: running ? 'primary.main' : 'white',
                      borderRadius: 2,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      boxShadow: running ? '0 0 20px rgba(2, 132, 199, 0.5)' : 'none',
                    }}
                  >
                    {/* Corner Markers */}
                    {[
                      { top: -4, left: -4 },
                      { top: -4, right: -4 },
                      { bottom: -4, left: -4 },
                      { bottom: -4, right: -4 },
                    ].map((pos, i) => (
                      <Box
                        key={i}
                        sx={{
                          position: 'absolute',
                          width: 20,
                          height: 20,
                          bgcolor: running ? 'primary.main' : 'white',
                          borderRadius: 1,
                          ...pos,
                        }}
                      />
                    ))}
                  </Box>

                  {/* Instruction Text */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -40,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(0,0,0,0.6)',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        fontWeight: 500,
                      }}
                    >
                      {running ? 'Position QR code inside the frame' : 'Click here or press Start to begin scanning'}
                    </Typography>
                  </Box>
                </Box>

                {/* Click to Stop Hint - Only visible on hover when running */}
                {running && (
                  <Box
                    className="video-overlay-hint"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    <StopIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption">Click to stop</Typography>
                  </Box>
                )}
              </Box>

              {/* Camera Inactive Overlay */}
              {!running && (
                <Box
                  className="camera-inactive-overlay"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    transition: 'background-color 0.3s ease',
                  }}
                >
                  <VideocamIcon sx={{ fontSize: 80, color: 'grey.500' }} />
                  <Typography variant="h6" color="grey.400">
                    Camera Inactive
                  </Typography>
                  {selectedCamera && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'grey.500',
                        mt: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <PlayIcon sx={{ fontSize: 18 }} />
                      Click to start camera
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Stack>

      {/* Toast Notification */}
      <Snackbar
        open={toast.visible}
        autoHideDuration={5000}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={hideToast} severity={toast.type} variant="filled" sx={{ minWidth: 300 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
