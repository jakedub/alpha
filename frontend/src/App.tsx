import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Fab } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import LightbulbOutlineRoundedIcon from '@mui/icons-material/LightbulbOutlineRounded';
import RoomList from './components/Rooms/RoomList';
import EventList from './components/Events/EventList';
import ThemeToggle from './components/Shared/ThemeToggle';
import Layout from './components/Shared/Layout';
import UserPreferences from './components/User/UserPreferences';
import './App.css';
import { getTheme } from './theme/theme';
import Home from './components/Shared/Home';
import EventDetail from './components/Events/EventDetail';
import LocationList from './components/Locations/LocationList';
import LocationDetail from './components/Locations/LocationDetail';
import { Calendar } from './components/Calendar/Calendar';

function App() {
  const [darkMode, setDarkMode] = useState(false);



  return (
    <ThemeProvider theme={getTheme(darkMode)}>
      <CssBaseline />
      <Router>
        <Layout>
          <Fab sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1300 }}>
            <IconButton
              onClick={() => setDarkMode(!darkMode)}
              color="inherit"
              aria-label="Toggle dark mode"
            >
              <LightbulbOutlineRoundedIcon />
            </IconButton>
          </Fab>
          <Routes>
            <Route path="/rooms" element={<RoomList />} />
            <Route path="/user" element={<UserPreferences />} />
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/locations/:id" element={<LocationDetail />} /> 
            <Route path="/locations" element={<LocationList />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path='/user-preference' element={<UserPreferences/>}/>
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;