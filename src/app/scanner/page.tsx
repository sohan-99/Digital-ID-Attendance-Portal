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

// Scanner locations configuration
const scannerLocations = [
  { value: 'Campus', label: '🏫 Campus', color: '#1976d2' },
  { value: 'Library', label: '📚 Library', color: '#2e7d32' },
  { value: 'Event', label: '🎉 Event', color: '#ed6c02' },
];

export default function Scanner() {
  const [msg, setMsg] = useState('');
  const [running, setRunning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Campus'); // Default to Campus
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scannerToken, setScannerToken] = useState<string | null>(null);

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
  const lastScanRef = useRef<string | null>(null);
  const scanAttemptRef = useRef<number>(0);


  // Authentication check
  useEffect(() => {
    // First check if scanner admin is logged in
    const scannerTokenValue = localStorage.getItem('scanner_token');
    const scannerAdminStr = localStorage.getItem('scanner_admin');
    
    if (scannerTokenValue && scannerAdminStr) {
      try {
        const scannerAdmin = JSON.parse(scannerAdminStr);
        // Auto-select location based on scanner admin
        setSelectedLocation(scannerAdmin.location || 'Campus');
        setScannerToken(scannerTokenValue);
        setIsAuthenticated(true);
        setIsAdmin(true);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Error parsing scanner admin data:', e);
      }
    }

    // Fallback to regular admin check
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
              width: { ideal: 640 }, // Reduced from 1280 for faster processing
              height: { ideal: 480 }, // Reduced from 720 for faster processing
              frameRate: { ideal: 30 } // Optimize frame rate
            }
          : { 
              facingMode: 'environment', 
              width: { ideal: 640 }, 
              height: { ideal: 480 },
              frameRate: { ideal: 30 }
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

    let frameCount = 0;
    const scanInterval = 3; // Scan every 3rd frame to reduce processing overhead

    const scanFrame = () => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        // Skip frames to reduce processing overhead
        frameCount++;
        if (frameCount % scanInterval !== 0) {
          rafRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        const width = (canvas.width = video.videoWidth);
        const height = (canvas.height = video.videoHeight);
        const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimize context

        if (!ctx) {
          rafRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        
        // Scan only center region for faster processing
        const centerSize = Math.min(width, height) * 0.6;
        const x = (width - centerSize) / 2;
        const y = (height - centerSize) / 2;
        
        const imageData = ctx.getImageData(x, y, centerSize, centerSize);
        const qrCode = jsQR(imageData.data, centerSize, centerSize, {
          inversionAttempts: 'dontInvert', // Skip inversion for faster scanning
        });

        if (qrCode && !cooldownRef.current) {
          // Prevent duplicate scans of the same QR code
          if (lastScanRef.current !== qrCode.data) {
            lastScanRef.current = qrCode.data;
            scanAttemptRef.current = 0;
            handleQRCodeDetected(qrCode.data);
          }
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
    setMsg('✓ QR Code detected - Verifying...');

    // Use scanner token if available, otherwise use regular token
    const token = scannerToken || localStorage.getItem('pundra_token');

    try {
      // Use scanner API if scanner token is available, otherwise use regular attendance API
      const apiUrl = scannerToken 
        ? '/api/scanner/scan'
        : '/api/attendance/scan';

      const payload = scannerToken
        ? { qrcodeToken: qrData } // Scanner API expects qrcodeToken
        : { token: qrData, location: selectedLocation }; // Regular API expects token and location

      const response = await axios.post(
        apiUrl,
        payload,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // 5 second timeout for faster failure
        }
      );

      const userName = response.data?.user?.name || 'Student';
      setMsg(`✓ Success! ${userName} checked in`);
      showToast(`✓ ${userName} checked in at ${selectedLocation}!`, 'success', true);
      
      // Reset for next scan after shorter delay
      setTimeout(() => {
        lastScanRef.current = null;
        setMsg('Ready for next scan');
      }, 1200);
    } catch (e: unknown) {
      console.error('Verification error', e);

      let errorMessage = 'Verification failed';
      
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { error?: string } | undefined;
        errorMessage = data?.error ?? e.message ?? errorMessage;
      } else if (e instanceof Error) {
        errorMessage = e.message || errorMessage;
      }

      setMsg(`✗ ${errorMessage}`);
      showToast(errorMessage, 'error');
      
      // Reset for retry
      lastScanRef.current = null;
    } finally {
      setTimeout(() => {
        cooldownRef.current = false;
        if (running) setMsg('Ready for next scan');
      }, 1500); // Reduced from 2000ms
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
                bgcolor: scannerLocations.find(loc => loc.value === selectedLocation)?.color || 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2,
                transition: 'background-color 0.3s ease',
              }}
            >
              <QrIcon sx={{ fontSize: 50, color: 'white' }} />
            </Box>

            <Typography variant="h4" fontWeight={700} gutterBottom>
              {scannerLocations.find(loc => loc.value === selectedLocation)?.label || '📍'} QR Code Scanner
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
              
              {/* Location Selection */}
              <FormControl fullWidth>
                <InputLabel id="location-select-label">Scanner Location</InputLabel>
                <Select
                  labelId="location-select-label"
                  value={selectedLocation}
                  label="Scanner Location"
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  disabled={running}
                  startAdornment={
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      {scannerLocations.find(loc => loc.value === selectedLocation)?.label.split(' ')[0] || '📍'}
                    </Box>
                  }
                >
                  {scannerLocations.map((location) => (
                    <MenuItem key={location.value} value={location.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: location.color,
                          }}
                        />
                        {location.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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

              {/* Location Status */}
              <Alert 
                severity="info" 
                icon={
                  <Box sx={{ fontSize: '1.2rem' }}>
                    {scannerLocations.find(loc => loc.value === selectedLocation)?.label.split(' ')[0] || '📍'}
                  </Box>
                }
                sx={{ 
                  borderRadius: 2,
                  borderLeft: `4px solid ${scannerLocations.find(loc => loc.value === selectedLocation)?.color}`,
                }}
              >
                <Typography variant="body2">
                  <strong>Active Location:</strong> {selectedLocation}
                  {scannerToken && ' (Scanner Admin Mode)'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All scans will be recorded at this location
                </Typography>
              </Alert>

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
