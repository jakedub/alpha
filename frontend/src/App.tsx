import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Fab } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import RoomList from './components/Rooms/RoomList';
import EventList from './components/Events/EventList';
import ThemeToggle from './components/Shared/ThemeToggle';
import Layout from './components/Shared/Layout';
import UserDetail from './components/User/UserDetail';
import UserList from './components/User/UserList';
import './App.css';
import { getTheme } from './theme/theme';
import Home from './components/Shared/Home';
import Scheduler from './components/Shared/Scheduler'
import EventDetail from './components/Events/EventDetail';
import LocationList from './components/Locations/LocationList';
import LocationDetail from './components/Locations/LocationDetail';
import { Calendar } from './components/User/Calendar'; 
import { LightbulbOutlined } from '@mui/icons-material';
import Login from './components/User/Login';
import ProtectedRoute from './auth/ProtectedRoute';
import GenConMap from './components/Map/GenConMap';

function App() {
  const [darkMode, setDarkMode] = useState(false);


  return (
    <ThemeProvider theme={getTheme(darkMode)}>
      <CssBaseline />
      <Router>
        <Layout>
          <Fab
            sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1300 }}
            onClick={() => setDarkMode(!darkMode)}
            color="inherit"
            aria-label="Toggle dark mode"
          >
            <LightbulbOutlined />
          </Fab>
          <Routes>
            <Route path="/rooms" element={<RoomList />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/locations/:id" element={<LocationDetail />} /> 
            <Route path="/locations" element={<LocationList />} />
            <Route path="/scheduler" element={ <ProtectedRoute><Scheduler /></ProtectedRoute> }/>
            <Route path="/calendar" element={<Calendar userEvents={[]} />} />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                  <UserDetail />
                </ProtectedRoute>
              } />
            <Route path="/login" element={<Login />} />
            <Route path="/map" element={<GenConMap />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;