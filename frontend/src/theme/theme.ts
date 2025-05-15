// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

export const getTheme = (darkMode: boolean) =>
  createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#5f6c7b' },
      secondary: { main: '#90b4ce' },
      text: {
        primary: '#094067',
        secondary: '#5f6c7b',
        disabled: '#ef4565'
      },
      background: {
        default: darkMode ? '#121212' : '#d8eefe',
        paper: '#fffffe',
      },
      error: { main: '#ef4565' },
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#fffffe',
          },
        },
      },
    },
  });