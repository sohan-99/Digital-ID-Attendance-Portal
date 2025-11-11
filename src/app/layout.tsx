import type { Metadata } from "next";
import "./globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme/theme';
import { Box } from '@mui/material';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: "Digital ID Attendance Portal",
  description: "QR-based digital ID and attendance tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ 
              minHeight: '100vh', 
              background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
            }}>
              <NavBar/>
              <Box component="main" sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
                {children}
              </Box>
            </Box>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
