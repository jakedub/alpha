// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

const AMBER = '#f59e0b';
const AMBER_LIGHT = '#fbbf24';
const AMBER_DARK = '#d97706';

export const getTheme = (darkMode: boolean) =>
  createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: AMBER,
        light: AMBER_LIGHT,
        dark: AMBER_DARK,
        contrastText: '#111827',
      },
      secondary: {
        main: AMBER_LIGHT,
        contrastText: '#111827',
      },
      text: {
        primary: darkMode ? '#f9fafb' : '#0f172a',
        secondary: darkMode ? '#9ca3af' : '#6b7280',
        disabled: darkMode ? '#4b5563' : '#9ca3af',
      },
      background: {
        default: darkMode ? '#111827' : '#f8fafc',
        paper: darkMode ? '#1f2937' : '#ffffff',
      },
      error: { main: '#ef4444' },
      divider: darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    },
    typography: {
      fontFamily: '"Inter", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 500 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: darkMode
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid #e5e7eb',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            borderBottom: darkMode
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid #e5e7eb',
            color: darkMode ? '#f9fafb' : '#0f172a',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: AMBER,
            height: 3,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            minWidth: 90,
            '&.Mui-selected': {
              color: AMBER,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: AMBER,
            color: '#111827',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: AMBER,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            '&.Mui-focused': {
              color: AMBER,
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            '&.Mui-checked': {
              color: AMBER,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: `${AMBER}22`,
              color: AMBER,
            },
            '&.Mui-selected:hover': {
              backgroundColor: `${AMBER}33`,
            },
          },
        },
      },
    },
  });