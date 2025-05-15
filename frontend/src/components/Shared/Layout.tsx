import React, { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupIcon from '@mui/icons-material/Group';
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <IconButton
        onClick={handleDrawerToggle}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        }}
      >
        <CloseIcon />
      </IconButton>
      <Box sx={{ mt: 6 }}>
        <List>
          {[
            { text: 'Home', path: '/', icon: <HomeIcon /> },
            { text: 'Rooms', path: '/rooms', icon: <MeetingRoomIcon /> },
            { text: 'Users', path: '/users', icon: <GroupIcon /> },
          ].map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                sx={{ textAlign: 'left' }}
                onClick={() => navigate(item.path)}
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
    <Box sx={{ display: 'flex', backgroundColor: theme.palette.background.default}}>
      <CssBaseline />
      <AppBar
        component="nav"
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          width: 'auto',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }}
      >
        <Toolbar disableGutters variant="dense">
          <IconButton
            edge="start"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            sx={{
              position: 'fixed',
              top: 25,
              left: 50,
              zIndex: (theme) => theme.zIndex.appBar + 1,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box component="nav">
        <StyledDrawer
          key={theme.palette.mode}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
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