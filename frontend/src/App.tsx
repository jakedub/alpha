import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import RoomList from './components/Rooms/RoomList';
import ThemeToggle from './components/Shared/ThemeToggle';
import Layout from './components/Shared/Layout';
import UserPreferences from './components/User/UserPreferences';
import './App.css';
import { getTheme } from './theme/theme';
import Home from './components/Shared/Home';
function App() {
  const [darkMode, setDarkMode] = useState(false);



  return (
    <ThemeProvider theme={getTheme(darkMode)}>
      <CssBaseline />
      <Router>
        <Layout>
          <div id="dark-button">
            <h1>{darkMode ? 'Dark Mode' : 'Light Mode'}</h1>
            <ThemeToggle onThemeChange={setDarkMode} />
          </div>
          <Routes>
            <Route path="/rooms" element={<RoomList />} />
            <Route path="/user" element={<UserPreferences />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;