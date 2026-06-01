import React, { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupIcon from '@mui/icons-material/Group';
import SyncIcon from '@mui/icons-material/Sync';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/api';
import NotificationBell from './NotificationBell';

// ── Primary nav tabs ────────────────────────────────────────────────────────
const PRIMARY_TABS = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Events', path: '/events', icon: <EventIcon fontSize="small" /> },
  { label: 'Schedule', path: '/fullcalendar2', icon: <CalendarMonthIcon fontSize="small" /> },
  { label: 'Vendors', path: '/vendors', icon: <StorefrontIcon fontSize="small" /> },
  { label: 'Map', path: '/map', icon: <MapIcon fontSize="small" /> },
];

// Map a pathname to a tab index (-1 = no match)
function resolveTabIndex(pathname: string): number {
  // Exact or prefix match
  const exact = PRIMARY_TABS.findIndex((t) => t.path === pathname);
  if (exact !== -1) return exact;
  // Parent prefix (e.g. /events/123 → Events tab)
  return PRIMARY_TABS.findIndex((t) => t.path !== '/' && pathname.startsWith(t.path));
}

// ── Layout ───────────────────────────────────────────────────────────────────
interface LayoutProps {
  children: ReactNode;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const Layout = ({ children, darkMode, setDarkMode }: LayoutProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const tabIndex = resolveTabIndex(location.pathname);

  // Settings menu
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const settingsOpen = Boolean(settingsAnchor);

  // User popover
  const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
  const userOpen = Boolean(userAnchor);

  const handleLogout = async () => {
    setUserAnchor(null);
    try {
      await api.post('/logout/');
      navigate('/login');
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const settingsItems = [
    { text: 'Locations', path: '/locations', icon: <LocationOnIcon fontSize="small" /> },
    { text: 'Rooms', path: '/rooms', icon: <MeetingRoomIcon fontSize="small" /> },
    { text: 'Users', path: '/users', icon: <GroupIcon fontSize="small" /> },
    { text: 'Data Sync', path: '/data-sync', icon: <SyncIcon fontSize="small" /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />

      {/* ── AppBar ─────────────────────────────────────────────────────────── */}
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>

          {/* Wordmark */}
          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              mr: 2,
              flexShrink: 0,
            }}
          >
            <CasinoIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography
              variant="h6"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: '0.08em',
                fontSize: '1.1rem',
              }}
            >
              ALPHA
            </Typography>
          </Box>

          {/* Primary tabs — centered */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <Tabs
              value={tabIndex === -1 ? false : tabIndex}
              onChange={(_e, newVal) => navigate(PRIMARY_TABS[newVal].path)}
              textColor="inherit"
              aria-label="primary navigation"
            >
              {PRIMARY_TABS.map((tab) => (
                <Tab
                  key={tab.path}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                  disableRipple={false}
                  sx={{ minHeight: 64 }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Right controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>

            {/* Notifications */}
            <NotificationBell />

            {/* Settings */}
            <Tooltip title="Settings">
              <IconButton
                size="medium"
                onClick={(e) => setSettingsAnchor(e.currentTarget)}
                aria-label="open settings menu"
                sx={{ color: 'text.secondary' }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={settingsAnchor}
              open={settingsOpen}
              onClose={() => setSettingsAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 3,
                sx: { mt: 0.5, minWidth: 180, borderRadius: 2 },
              }}
            >
              {settingsItems.map((item) => (
                <MenuItem
                  key={item.text}
                  onClick={() => { setSettingsAnchor(null); navigate(item.path); }}
                  sx={{ gap: 1, borderRadius: 1, mx: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </MenuItem>
              ))}
            </Menu>

            {/* Theme toggle */}
            <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
              <IconButton
                size="medium"
                onClick={() => setDarkMode(!darkMode)}
                aria-label="toggle theme"
                sx={{ color: 'text.secondary' }}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* User button */}
            <Tooltip title={user ? 'Account' : 'Log in'}>
              <IconButton
                size="medium"
                onClick={(e) => setUserAnchor(e.currentTarget)}
                aria-label="account menu"
                sx={{ color: user ? 'primary.main' : 'text.secondary' }}
              >
                {user ? <AccountCircleIcon /> : <LoginIcon />}
              </IconButton>
            </Tooltip>
            <Popover
              open={userOpen}
              anchorEl={userAnchor}
              onClose={() => setUserAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 3,
                sx: { mt: 0.5, p: 2, minWidth: 200, borderRadius: 2 },
              }}
            >
              {user ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {(user as any).username ?? (user as any).email ?? 'Signed in'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                    {(user as any).email ?? ''}
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <MenuItem
                    onClick={handleLogout}
                    sx={{ borderRadius: 1, px: 1, gap: 1, color: 'error.main' }}
                  >
                    <LogoutIcon fontSize="small" />
                    <Typography variant="body2">Log out</Typography>
                  </MenuItem>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    You're not signed in.
                  </Typography>
                  <MenuItem
                    onClick={() => { setUserAnchor(null); navigate('/login'); }}
                    sx={{ borderRadius: 1, px: 1, gap: 1, color: 'primary.main' }}
                  >
                    <LoginIcon fontSize="small" />
                    <Typography variant="body2">Log in</Typography>
                  </MenuItem>
                </Box>
              )}
            </Popover>

          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
