"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  profilePicture?: string;
}

export default function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(() => {
    // Initialize user state from localStorage on mount
    try {
      const raw = localStorage.getItem('pundra_user');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
    return null;
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(() => {
    // Initialize profile picture from localStorage on mount
    try {
      const raw = localStorage.getItem('pundra_user');
      if (raw) {
        const userData = JSON.parse(raw);
        return userData.profilePicture || null;
      }
    } catch (e) {
      console.error('Error loading profile picture:', e);
    }
    return null;
  });
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // Fetch the latest user data including profile picture
    const token = localStorage.getItem('pundra_token');
    if (token) {
      axios.get('http://localhost:3000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        setProfilePicture(updatedUser.profilePicture);
        // Update localStorage with latest data
        localStorage.setItem('pundra_user', JSON.stringify(updatedUser));
      })
      .catch(err => {
        console.error('Failed to fetch user data:', err);
        // Keep the cached data on error
      });
    }
  }, []);

  function logout(){
    localStorage.removeItem('pundra_token');
    localStorage.removeItem('pundra_user');
    setUser(null);
    window.location.href = '/';
  }

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

  // Dynamic navigation items - Hide Home when on home page, Scanner only for admins
  const navItems = [
    { label: 'Home', href: '/', icon: <HomeIcon />, show: pathname !== '/' },
    { label: 'Scanner', href: '/scanner', icon: <ScannerIcon />, show: !!user && user.isAdmin },
    { label: 'Profile', href: '/profile', icon: <PersonIcon />, show: !!user },
    { label: 'Admin', href: '/admin', icon: <AdminIcon />, show: !!user && user.isAdmin },
  ].filter(item => item.show);

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
                <MenuItem key={item.label} onClick={handleCloseNavMenu}>
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
              <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                <Button
                  sx={{ 
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
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
                        user.isAdmin ? (
                          <AdminIcon 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              bgcolor: 'secondary.main', 
                              borderRadius: '50%',
                              p: 0.3,
                              color: 'white',
                            }} 
                          />
                        ) : null
                      }
                    >
                      <Avatar 
                        src={profilePicture || undefined} 
                        alt={user.name}
                        sx={{ 
                          bgcolor: profilePicture ? 'transparent' : 'primary.main',
                          width: 40,
                          height: 40,
                          border: user.isAdmin ? '2px solid' : 'none',
                          borderColor: 'secondary.main',
                        }}
                      >
                        {!profilePicture && (user.name ? user.name[0].toUpperCase() : 'U')}
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
                      src={profilePicture || undefined} 
                      alt={user.name}
                      sx={{ 
                        bgcolor: profilePicture ? 'transparent' : 'primary.main',
                        width: 48,
                        height: 48,
                      }}
                    >
                      {!profilePicture && (user.name ? user.name[0].toUpperCase() : 'U')}
                    </Avatar>
                    <Box>
                      <Typography fontWeight="600" sx={{ lineHeight: 1.2 }}>
                        {user.name || user.email}
                      </Typography>
                      {user.isAdmin && (
                        <Typography variant="caption" color="secondary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <AdminIcon sx={{ fontSize: 14 }} />
                          Administrator
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
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button variant="contained" color="primary" size="medium">
                  Login
                </Button>
              </Link>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
