'use client';

import dynamic from 'next/dynamic';
import { Box, Typography } from '@mui/material';

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });


interface QRCodeDisplayProps {
  token?: string;
  size?: number;
}


export default function QRCodeDisplay({ token, size = 220 }: QRCodeDisplayProps) {
  if (!token) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center', 
        bgcolor: 'background.paper', 
        borderRadius: 2 
      }}>
        <Typography variant="body2" color="text.secondary">
          No token available
        </Typography>
      </Box>
    );
  }
  
  const logoSrc = '/qr-center.png';
  const logoPercent = 0.18;
  const logoSize = Math.round(size * logoPercent);
  

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center' 
    }}>
      
      <Box 
        sx={{ 
          position: 'relative', 
          bgcolor: 'white', 
          borderRadius: 2,
          width: size, 
          height: size,
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ width: size, height: size }}>
          <QRCode value={token} size={size} />
        </Box>

        {/* Centered logo overlay */}
        <Box
          component="img"
          src={logoSrc}
          alt="logo"
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: logoSize,
            height: logoSize,
            transform: 'translate(-50%, -50%)',
            borderRadius: 2,
            bgcolor: 'white',
            p: 0.5,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Present this QR at scanners across campus.
      </Typography>

    </Box>
  );
}
