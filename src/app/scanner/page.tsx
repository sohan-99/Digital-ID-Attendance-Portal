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
  const [selectedCamera, setSelectedCamera] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'info' | 'success' | 'error' 
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef(false);


  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('pundra_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const userStr = localStorage.getItem('pundra_user');
    if (!userStr) {
      window.location.href = '/login';
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      if (!user.isAdmin) {
        setMsg('Access denied. Scanner is only available for administrators.');
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }

      setIsAdmin(true);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (e) {
      console.error('Error parsing user data:', e);
      window.location.href = '/login';
    }
  }, []);


  // List available cameras
  useEffect(() => {
    async function listCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoCameras = devices.filter((d) => d.kind === 'videoinput');
        
        setCameras(videoCameras);
        
        if (videoCameras.length > 0) {
          setSelectedCamera(videoCameras[0].deviceId);
        }
      } catch (e) {
        console.error('Failed to list cameras', e);
        setMsg('Unable to list camera devices');
      }
    }

    listCameras();
  }, []);


  async function startScanning(deviceId: string) {
    try {
      setMsg('Requesting camera access...');

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { 
              deviceId: { exact: deviceId }, 
              width: { ideal: 1280 }, 
              height: { ideal: 720 } 
            }
          : { 
              facingMode: 'environment', 
              width: { ideal: 1280 }, 
              height: { ideal: 720 } 
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setRunning(true);
      setMsg('Camera active - Position QR code in frame');
      startScanLoop();
    } catch (err) {
      console.error('Camera access error', err);
      setMsg('Camera access denied or not available');
      setRunning(false);
      showToast('Camera access denied or not available', 'error');
    }
  }


  function stopScanning() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setRunning(false);
    setMsg('Scanner stopped');
  }


  async function startScanLoop() {
    const jsqrModule = await import('jsqr');
    const jsQR = jsqrModule.default || jsqrModule;

    const scanFrame = () => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        const width = (canvas.width = video.videoWidth);
        const height = (canvas.height = video.videoHeight);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          rafRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const qrCode = jsQR(imageData.data, width, height);

        if (qrCode && !cooldownRef.current) {
          handleQRCodeDetected(qrCode.data);
        }
      } catch (e) {
        console.debug('Scan loop error', e);
      }

      rafRef.current = requestAnimationFrame(scanFrame);
    };

    rafRef.current = requestAnimationFrame(scanFrame);
  }


  async function handleQRCodeDetected(qrData: string) {
    cooldownRef.current = true;
    setMsg('QR Code detected - Verifying...');

    const token = localStorage.getItem('pundra_token');

    try {
      await axios.post(
        'http://localhost:3000/api/attendance/scan',
        { token: qrData, location: 'Camera/Scanner' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMsg('Attendance recorded successfully!');
      showToast('✓ Attendance recorded successfully!', 'success', true);
      
      setTimeout(() => stopScanning(), 1500);
    } catch (e: unknown) {
      console.error('Verification error', e);

      let errorMessage = 'Verification failed';
      
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { error?: string } | undefined;
        errorMessage = data?.error ?? e.message ?? errorMessage;
      } else if (e instanceof Error) {
        errorMessage = e.message || errorMessage;
      }

      setMsg(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setTimeout(() => {
        cooldownRef.current = false;
        if (running) setMsg('Ready for next scan');
      }, 2000);
    }
  }


  function showToast(
    message: string, 
    type: 'info' | 'success' | 'error' = 'info', 
    sticky = false
  ) {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ visible: true, message, type });

    const delay = sticky ? 5000 : 3000;
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
      toastTimerRef.current = null;
    }, delay);
  }


  function hideToast() {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast((prev) => ({ ...prev, visible: false }));
  }


  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }


  // Access denied state
  if (!isAuthenticated || !isAdmin) {
    return (
      <Container maxWidth="lg">
        <Stack spacing={4} sx={{ py: 4 }}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
              
              <Typography variant="h4" fontWeight={700} gutterBottom color="error">
                Access Denied
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {msg || 'Scanner functionality is only available for administrators.'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Redirecting to home page...
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    );
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
                  {cameras.length === 0 && (
                    <MenuItem value="">Loading cameras...</MenuItem>
                  )}
                  
                  {cameras.map((camera) => (
                    <MenuItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.substring(0, 8)}...`}
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
                  onClick={() => startScanning(selectedCamera)}
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
                  onClick={stopScanning}
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
                  stopScanning();
                } else {
                  startScanning(selectedCamera);
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
                      {running 
                        ? 'Position QR code inside the frame' 
                        : 'Click here or press Start to begin scanning'
                      }
                    </Typography>
                  </Box>

                </Box>


                {/* Click to Stop Hint */}
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
