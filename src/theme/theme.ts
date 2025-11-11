'use client'

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0ea5e9', // sky-500
      light: '#38bdf8', // sky-400
      dark: '#0284c7', // sky-600
    },
    secondary: {
      main: '#ec4899', // pink-500
      light: '#f472b6', // pink-400
      dark: '#db2777', // pink-600
    },
    success: {
      main: '#22c55e', // green-500
    },
    warning: {
      main: '#f97316', // orange-500
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
});

export default theme;
