"use client";

import Link from 'next/link';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme,
  Badge,
} from '@mui/material';
import { 
  Home as HomeIcon, 
  QrCodeScanner as ScannerIcon, 
  Person as PersonIcon, 
  AdminPanelSettings as AdminIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

interface User {
  id?: number;
  name?: string;
  email?: string;
  isAdmin?: boolean;
  role?: 'super_admin' | 'admin' | 'user';
  profilePicture?: string;
}

export default function NavBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isFetchingRef = useRef(false);
  
  // Initialize state from localStorage synchronously
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('pundra_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Stable function to fetch user data
  const fetchUserData = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    const token = localStorage.getItem('pundra_token');
    if (!token) {
      setUser(null);
      return;
    }

    isFetchingRef.current = true;
    try {
      const res = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('pundra_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Mount effect - run once
  useEffect(() => {
    setMounted(true);
    fetchUserData();

    // Listen for custom events
    const handleLoginEvent = () => fetchUserData();
    const handleProfileUpdate = () => {
      // Update user from localStorage when profile is updated
      const raw = localStorage.getItem('pundra_user');
      if (raw) {
        setUser(JSON.parse(raw));
      }
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pundra_user' || e.key === 'pundra_token') {
        const raw = localStorage.getItem('pundra_user');
        setUser(raw ? JSON.parse(raw) : null);
      }
    };

    window.addEventListener('userLoggedIn', handleLoginEvent);
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('userLoggedIn', handleLoginEvent);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchUserData]);

  const logout = useCallback(() => {
    localStorage.removeItem('pundra_token');
    localStorage.removeItem('pundra_user');
    setUser(null);
    window.location.href = '/';
  }, []);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // Memoize navigation items - only recompute when user, isAdmin, or pathname changes
  const navItems = useMemo(() => {
    const items = [];
    
    // Only show Home if not on home page
    if (pathname !== '/') {
      items.push({ label: 'Home', href: '/', icon: <HomeIcon key="home-icon" /> });
    }
    
    // Only show Profile when user is logged in
    if (user) {
      items.push({ label: 'Profile', href: '/profile', icon: <PersonIcon key="profile-icon" /> });
    }
    
    // Show Scanner and Admin for admin users
    if (user?.isAdmin) {
      // Insert Scanner after Home (or at beginning if Home is hidden)
      const scannerIndex = pathname === '/' ? 0 : 1;
      items.splice(scannerIndex, 0, { label: 'Scanner', href: '/scanner', icon: <ScannerIcon key="scanner-icon" /> });
      items.push({ label: 'Admin', href: '/admin', icon: <AdminIcon key="admin-icon" /> });
    }
    
    return items;
  }, [user, user?.isAdmin, pathname]);

  // Don't render dynamic content until mounted
  if (!mounted) {
    return (
      <AppBar position="sticky" color="default" elevation={2} sx={{ bgcolor: 'background.paper' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 4 }}>
              <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar src="/logo.png" alt="Pundra Logo" sx={{ width: 40, height: 40 }} />
                <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '.5px' }}>
                  Pundra Portal
                </Typography>
              </Link>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
          </Toolbar>
        </Container>
      </AppBar>
    );
  }

  return (
    <AppBar position="sticky" color="default" elevation={2} sx={{ bgcolor: 'background.paper' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Desktop Logo */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 4 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar src="/logo.png" alt="Pundra Logo" sx={{ width: 40, height: 40 }} />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  letterSpacing: '.5px',
                }}
              >
                Pundra Portal
              </Typography>
            </Link>
          </Box>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {navItems.map((item) => (
                <MenuItem key={item.href} onClick={handleCloseNavMenu}>
                  <Link href={item.href} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    {item.icon}
                    <Typography textAlign="center">{item.label}</Typography>
                  </Link>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, alignItems: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar src="/logo.png" alt="Pundra Logo" sx={{ width: 32, height: 32 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  whiteSpace: 'nowrap',
                }}
              >
                Pundra Portal
              </Typography>
            </Link>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <Button
                  sx={{ 
                    color: pathname === item.href ? 'primary.main' : 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    bgcolor: pathname === item.href ? 'primary.50' : 'transparent',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'primary.50',
                    },
                  }}
                  startIcon={item.icon}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </Box>

          {/* User Menu */}
          <Box sx={{ flexGrow: 0 }}>
            {user ? (
              <>
                <Tooltip title="Account settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        user.isAdmin || user.role === 'admin' || user.role === 'super_admin' ? (
                          <AdminIcon 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              bgcolor: user.role === 'super_admin' ? 'error.main' : 'secondary.main', 
                              borderRadius: '50%',
                              p: 0.3,
                              color: 'white',
                            }} 
                          />
                        ) : null
                      }
                    >
                      <Avatar 
                        src={user.profilePicture || undefined} 
                        alt={user.name}
                        sx={{ 
                          bgcolor: user.profilePicture ? 'transparent' : 'primary.main',
                          width: 40,
                          height: 40,
                          border: (user.isAdmin || user.role === 'admin' || user.role === 'super_admin') ? '2px solid' : 'none',
                          borderColor: user.role === 'super_admin' ? 'error.main' : 'secondary.main',
                        }}
                      >
                        {!user.profilePicture && (user.name ? user.name[0].toUpperCase() : 'U')}
                      </Avatar>
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      src={user.profilePicture || undefined} 
                      alt={user.name}
                      sx={{ 
                        bgcolor: user.profilePicture ? 'transparent' : 'primary.main',
                        width: 48,
                        height: 48,
                      }}
                    >
                      {!user.profilePicture && (user.name ? user.name[0].toUpperCase() : 'U')}
                    </Avatar>
                    <Box>
                      <Typography fontWeight="600" sx={{ lineHeight: 1.2 }}>
                        {user.name || user.email}
                      </Typography>
                      {(user.isAdmin || user.role === 'admin' || user.role === 'super_admin') && (
                        <Typography 
                          variant="caption" 
                          color={user.role === 'super_admin' ? 'error.main' : 'secondary.main'} 
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                        >
                          <AdminIcon sx={{ fontSize: 14 }} />
                          {user.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <MenuItem onClick={() => { window.location.href = '/profile'; }}>
                    <PersonIcon sx={{ mr: 1 }} fontSize="small" />
                    <Typography textAlign="center">Profile</Typography>
                  </MenuItem>
                  {user.isAdmin && (
                    <MenuItem onClick={() => { window.location.href = '/admin'; }}>
                      <AdminIcon sx={{ mr: 1 }} fontSize="small" />
                      <Typography textAlign="center">Admin Dashboard</Typography>
                    </MenuItem>
                  )}
                  <MenuItem onClick={() => { handleCloseUserMenu(); logout(); }}>
                    <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              pathname !== '/login' && pathname !== '/register' && pathname !== '/admin-login' && (
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <Button variant="contained" color="primary" size="medium">
                    Login
                  </Button>
                </Link>
              )
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
