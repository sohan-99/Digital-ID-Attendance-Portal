'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  useTheme,
  alpha,
  Grid,
  Paper,
} from '@mui/material'
import {
  QrCode2 as QrCodeIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  School as SchoolIcon,
  LibraryBooks as LibraryIcon,
  Event as EventIcon,
  ArrowForward as ArrowForwardIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'

interface User {
  name?: string;
  email?: string;
}

export default function Home(){
  const [user, setUser] = useState<User | null>(null)
  const theme = useTheme()

  useEffect(()=>{
    try{ 
      const raw = localStorage.getItem('pundra_user'); 
      if(raw) setUser(JSON.parse(raw)) 
    }catch(e){}
  }, [])

  const features = [
    {
      icon: <QrCodeIcon sx={{ fontSize: 48 }} />,
      title: 'Unified Digital ID',
      description: 'One QR-powered ID for lecture halls, library, and campus events.',
      color: theme.palette.primary.main,
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 48 }} />,
      title: 'Real-time Tracking',
      description: 'Instant logging on scan, centralized records for analytics.',
      color: theme.palette.secondary.main,
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 48 }} />,
      title: 'Analytics & Reports',
      description: 'Admins get dashboards and CSV exports for attendance insights.',
      color: theme.palette.success.main,
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: 'Secure & Reliable',
      description: 'Encrypted data storage with role-based access control for privacy.',
      color: theme.palette.warning.main,
    },
  ];

  const useCases = [
    { icon: <SchoolIcon />, label: 'Lecture Halls' },
    { icon: <LibraryIcon />, label: 'Library Access' },
    { icon: <EventIcon />, label: 'Campus Events' },
  ];

  return (
    <Container maxWidth="lg">
      <Stack spacing={10} sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                Digital ID & Attendance Portal
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 4, lineHeight: 1.6 }}
              >
                QR-based unified digital ID for classes, library, and events. Fast attendance logging and activity analytics for faculty and administrators.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {!user ? (
                  <>
                    <Link href="/register" style={{ textDecoration: 'none' }}>
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                      >
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/login" style={{ textDecoration: 'none' }}>
                      <Button
                        variant="outlined"
                        size="large"
                        sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                      >
                        Login
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/profile" style={{ textDecoration: 'none' }}>
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                      >
                        My Profile
                      </Button>
                    </Link>
                    <Link href="/scanner" style={{ textDecoration: 'none' }}>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<QrCodeIcon />}
                        sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                      >
                        Open Scanner
                      </Button>
                    </Link>
                  </>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  width: '100%',
                  height: 250,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrCodeIcon sx={{ fontSize: 200, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Box>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            textAlign="center"
            fontWeight={700}
            sx={{ mb: 4 }}
          >
            Key Features
          </Typography>
          <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
            {features.map((feature, index) => (
              <Card
                key={index}
                sx={{
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(feature.color, 0.1),
                      color: feature.color,
                      mb: 3,
                      mx: 'auto',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        <Paper
          sx={{
            p: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h5"
            component="h3"
            gutterBottom
            textAlign="center"
            fontWeight={600}
            sx={{ mb: 3 }}
          >
            Use Cases
          </Typography>
          <Grid container spacing={6} justifyContent="center">
            {useCases.map((useCase, index) => (
              <Grid item xs={12} sm={4} key={index}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                      color: 'primary.main',
                      boxShadow: theme.shadows[2],
                    }}
                  >
                    {useCase.icon}
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {useCase.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Stack>
    </Container>
  )
}

