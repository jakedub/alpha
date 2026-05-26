import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import RoomList from './components/Rooms/RoomList';
import EventList from './components/Events/EventList';
import Layout from './components/Shared/Layout';
import UserDetail from './components/User/UserDetail';
import UserList from './components/User/UserList';
import './App.css';
import { getTheme } from './theme/theme';
import Home from './components/Shared/Home';
import Scheduler from './components/Shared/Scheduler';
import EventDetail from './components/Events/EventDetail';
import LocationList from './components/Locations/LocationList';
import LocationDetail from './components/Locations/LocationDetail';
import { Calendar } from './components/User/Calendar';
import Login from './components/User/Login';
import ProtectedRoute from './auth/ProtectedRoute';
import GenConMap from './components/Map/GenConMap';
import Calendar1 from './components/Shared/Calendar1';
import Calendar2 from './components/Shared/Calendar2';
import EventRouteMap from './components/Map/EventRouteMap';
import VendorDetail from './components/Vendors/VendorDetail';
import VendorList from './components/Vendors/VendorList';
import DevConsoleButton from './components/Shared/DevConsoleButton';
import DataSyncPage from './components/Shared/DataSyncPage';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <ThemeProvider theme={getTheme(darkMode)}>
      <CssBaseline />
      <Router>
        <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
          <DevConsoleButton />
          <Routes>
            <Route path="/fullcalendar" element={<Calendar1/>}/>
            <Route path="/fullcalendar2" element={<Calendar2/>}/>
            <Route path="/event-route-map" element={<EventRouteMap />} />
            <Route path="/vendors/:gencon_id" element={<VendorDetail />} />
            <Route path="/vendors" element={<VendorList />} />
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
            <Route path="/data-sync" element={<DataSyncPage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;