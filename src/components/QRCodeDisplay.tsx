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
  const logoPercent = 0.12; // Reduced logo size for better scanning
  const logoSize = Math.round(size * logoPercent);
  
  // Optimized padding for white quiet zone (improves scan reliability)
  const quietZone = 16;
  const totalSize = size + (quietZone * 2);
  

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center' 
    }}>
      
      {/* Teal background container for visual consistency */}
      <Box 
        sx={{ 
          position: 'relative', 
          bgcolor: '#008780', // Teal background
          borderRadius: 3,
          p: 2,
          boxShadow: '0 4px 12px rgba(0, 135, 128, 0.2)',
        }}
      >
        {/* White container with quiet zone for optimal scanning */}
        <Box 
          sx={{ 
            position: 'relative', 
            bgcolor: 'white', 
            borderRadius: 2,
            width: totalSize, 
            height: totalSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          <Box sx={{ width: size, height: size }}>
            <QRCode 
              value={token} 
              size={size}
              level="M" // Medium error correction (25% recovery) - optimal balance
              fgColor="#000000" // Pure black for maximum contrast
              bgColor="#FFFFFF" // Pure white background
              style={{ 
                display: 'block',
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          </Box>

          {/* Centered logo overlay - smaller for better scanning */}
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
              borderRadius: 1.5,
              bgcolor: 'white',
              p: 0.3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Present this QR at scanners across campus.
      </Typography>

    </Box>
  );
}
