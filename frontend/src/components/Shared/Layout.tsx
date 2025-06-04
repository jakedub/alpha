import React, { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import HomeIcon from '@mui/icons-material/Home';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import StadiumRoundedIcon from '@mui/icons-material/StadiumRounded';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { blue, green, pink, purple } from '@mui/material/colors';
import RoomSharpIcon from '@mui/icons-material/RoomSharp';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/api';

const HamburgerToggle = ({ isOpen }: { isOpen: boolean }) => (
  <Box
    component={motion.div}
    animate={isOpen ? 'open' : 'closed'}
    sx={{ width: 24, height: 24, position: 'relative' }}
  >
    <Box
      component={motion.span}
      variants={{ open: { rotate: 45, top: '50%' }, closed: { rotate: 0, top: 4 } }}
      transition={{ duration: 0.3 }}
      sx={{
        position: 'absolute', left: 0, width: '100%', height: 2, bgcolor: 'currentColor',
        borderRadius: 1, transformOrigin: 'center',
      }}
    />
    <Box
      component={motion.span}
      variants={{ open: { opacity: 0 }, closed: { opacity: 1 } }}
      transition={{ duration: 0.3 }}
      sx={{
        position: 'absolute', top: '50%', left: 0, width: '100%', height: 2,
        bgcolor: 'currentColor', borderRadius: 1, transform: 'translateY(-50%)',
      }}
    />
    <Box
      component={motion.span}
      variants={{ open: { rotate: -45, top: '50%' }, closed: { rotate: 0, top: 16 } }}
      transition={{ duration: 0.3 }}
      sx={{
        position: 'absolute', left: 0, width: '100%', height: 2, bgcolor: 'currentColor',
        borderRadius: 1, transformOrigin: 'center',
      }}
    />
  </Box>
);

const drawerWidth = 240;
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.secondary,
    width: drawerWidth,
    boxSizing: 'border-box',
  },
}));

const Layout = ({ children }: { children: ReactNode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    try {
      const res = await api.post('/logout/');
      console.log('Logout response:', res.data);
      navigate('/login');
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const drawerItems = [
    { text: 'Home', path: '/', icon: <HomeIcon /> },
    !user && { text: 'Login', path: '/login', icon: <LoginIcon /> },
    { text: 'All Events', path: '/events', icon: <EventIcon /> },
    { text: 'All Users', path: '/users', icon: <GroupIcon sx={{ color: green }} /> },
    user && { text: 'Dashboard', path: '/dashboard', icon: <GroupIcon sx={{ color: blue[500] }} /> },
    user && { text: 'Scheduler', path: '/scheduler', icon: <HomeIcon sx={{ color: blue[500] }} /> },
    { text: 'Locations', path: '/locations', icon: <StadiumRoundedIcon /> },
    { text: 'Rooms', path: '/rooms', icon: <MeetingRoomIcon /> },
    { text: 'Map', path:'/map', icon: <RoomSharpIcon sx={{ color: purple[500] }} />},
    { text: 'Calendar', path: '/calendar', icon: <HomeIcon sx={{ color: pink[500] }} /> },
    user && { text: 'Logout', action: handleLogout, icon: <LogoutIcon /> },
  ].filter(Boolean);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mt: 6 }}>
        <List>
          {drawerItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                sx={{ textAlign: 'left' }}
                onClick={() => item.action ? item.action() : navigate(item.path!)}
              >
                <ListItemIcon sx={{ color: theme.palette.text.primary }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', backgroundColor: theme.palette.background.default }}>
      <CssBaseline />
      <motion.div
        animate={{ x: mobileOpen ? drawerWidth + 10 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          top: 50,
          left: 50,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <IconButton
          edge="start"
          aria-label="open drawer"
          onClick={handleDrawerToggle}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          <HamburgerToggle isOpen={mobileOpen} />
        </IconButton>
      </motion.div>

      <Box component="nav">
        <StyledDrawer
          key={theme.palette.mode}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
        >
          {drawer}
        </StyledDrawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;