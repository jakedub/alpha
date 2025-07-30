import React, { useEffect, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import {
  Grid,
  Button,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';
import { Calendar } from './Calendar';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/api';
import type { UserEvent } from '../../models/user_event';
import type { CalendarEvent as CalendarEventRaw } from '../../models/calendar_event';
import type { RelatedUser } from '../../models/related_user';
import { ColorOptions, RelationshipOptions } from '../../models/enum';
import VendorVisitList from '../VendorVisit/VendorVisitList';
import WatchedEventList from './WatchedEventList';
import { openConsoleWindow } from '../../utils/devConsole';
import { User } from '../../models/user';

interface CalendarEventDisplay {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  category?: string;
  color?: string;
}

// Transformer functions
function mapCalendarEventRawToDisplay(ce: CalendarEventRaw): CalendarEventDisplay {
  if (ce.event_type === 'vendor_visit' && ce.vendor_visit) { 
    console.log('Full vendor visit data:', ce.vendor_visit);
  }
  return {
    title: ce.title_override ?? ce.title ?? 'Untitled Event',
    start: new Date(ce.effective_start_time ?? ce.start_time),
    end: new Date(ce.effective_end_time ?? ce.end_time),
    category: ce.event_type,
    description: ce.vendor_visit?.note ?? '',
  };
}

function mapUserEventToDisplay(ue: UserEvent, color?: string): CalendarEventDisplay {
  return {
    title: ue.event_title,
    description: ue.event_short_description,
    start: new Date(ue.event_start_time),
    end: new Date(ue.event_end_time),
    category: ue.status,
    color,
  };
}

const UserDetail = () => {
  const { user, loading, setUser } = useAuth();
  const theme = useTheme();

  const [mobilityAid, setMobilityAid] = useState('');
  const [stairPreference, setStairPreference] = useState('');
  const [color_code, setColorCode] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [newColor, setNewColor] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [calendarEventsRaw, setCalendarEventsRaw] = useState<CalendarEventRaw[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventDisplay[]>([]);


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const refreshUserData = async () => {
    try {
      const updatedUser = await api.get(`/users/${user?.id}/`);
      if (setUser) {
        setUser(updatedUser.data);
      }
    } catch (error) {
      console.error("Failed to refresh user data", error);
    }
  };

  if (loading) return <CircularProgress />;
  if (!user) return <Typography>You are not logged in.</Typography>;

  // Fetch calendar events from API separately
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const res = await api.get(`/calendar_events/?user=${user?.id}`);
        setCalendarEventsRaw(res.data.results);
      } catch (err) {
        console.error('[❌] Failed to fetch calendar events:', err);
      }
    };

    if (user?.id) {
      fetchCalendarEvents();
    }
  }, [user?.id]);

  // Set initial form state from user
  useEffect(() => {
    if (user) {
      setMobilityAid(user.mobility_aid || '');
      setStairPreference(user.stair_preference || '');
      setColorCode(user.color_code || '');
    }
  }, [user]);

  // Merge and map events for calendar display
  useEffect(() => {
    const mappedCalendar = calendarEventsRaw.map(mapCalendarEventRawToDisplay);
    const mappedUserEvents = (user?.user_events ?? []).map((ue: UserEvent) =>
      mapUserEventToDisplay(ue, user.color_code || '#1976d2')
    );

    setCalendarEvents([...mappedCalendar, ...mappedUserEvents]);
  }, [calendarEventsRaw, user]);
  

  useEffect(() => {
    openConsoleWindow();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.patch(`/users/${user?.id}/`, {
        mobility_aid: mobilityAid || null,
        stair_preference: stairPreference || null,
        color_code: color_code || null,
      });

      setSnackbarMessage(
        `Preferences updated: Mobility Aid = ${mobilityAid || 'None'}, Stair Preference = ${stairPreference || 'None'}, Color = ${color_code || 'Default'}`
      );
      setSnackbarOpen(true);

      // Refresh calendar events colors after preference update
      const updatedEvents = (user?.user_events ?? []).map((ue: UserEvent) =>
        mapUserEventToDisplay(ue, color_code || '#1976d2')
      );
      setCalendarEvents(updatedEvents);

    } catch {
      setMessage('Error updating preferences.');
    }
  };

  return (
    <Box sx={{ overflowX: 'hidden', width: '75vw', margin: '0 auto', padding: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4">{user.username}'s Dashboard</Typography>
      </Box>
      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ marginBottom: 2 }}>
        <Tab label="Events" />
        <Tab label="Preferences" />
        <Tab label="Vendors" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3} padding={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5">Your Events</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Game ID</strong></TableCell>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>Short Description</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {user?.user_events?.map((event: UserEvent) => (
                    <TableRow key={event.event_id}>
                      <TableCell>
                        <a
                          href={`https://www.gencon.com/events/${event.event_game_id.match(/\d+$/)?.[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {event.event_game_id}
                        </a>
                      </TableCell>
                      <TableCell>{event.event_title}</TableCell>
                      <TableCell>{event.event_short_description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h5">Watched Events</Typography>
            <Box sx={{ mt: 2 }}>
              <WatchedEventList />
            </Box>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3} padding={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ padding: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6">Update Preferences: {user.username}</Typography>
              <form onSubmit={handleSubmit}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Mobility Aid</InputLabel>
                  <Select
                    value={mobilityAid}
                    onChange={(e) => setMobilityAid(e.target.value)}
                    label="Mobility Aid"
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="none">No Issues</MenuItem>
                    <MenuItem value="wheelchair">Wheelchair</MenuItem>
                    <MenuItem value="cane">Cane</MenuItem>
                    <MenuItem value="walker">Walker</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Stair Preference</InputLabel>
                  <Select
                    value={stairPreference}
                    onChange={(e) => setStairPreference(e.target.value)}
                    label="Stair Preference"
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="stairs">Prefer Stairs</MenuItem>
                    <MenuItem value="elevator">Prefer Elevator</MenuItem>
                    <MenuItem value="no_preference">No Preference</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>User Color Preference</InputLabel>
                  <Select
                    value={color_code}
                    onChange={(e) => setColorCode(e.target.value)}
                    label="Schedule Color"
                  >
                    {ColorOptions.map((color) => (
                      <MenuItem key={color.value} value={color.value}>
                        <Box sx={{ display: 'inline-block', width: 16, height: 16, backgroundColor: color.value, mr: 1, borderRadius: '50%' }} />
                        {color.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button type="submit" variant="contained">Save Preferences</Button>
              </form>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ padding: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6">Friends and Family</Typography>
              {user.related_users && user.related_users.length > 0 ? (
                <ul>
                  {user.related_users.map((r: RelatedUser) => (
                    <li key={r.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: r.color_code,
                        }} />
                        <Typography variant="body2">
                          {`${r.name} (${RelationshipOptions.find(opt => opt.value === String(r.relationship))?.label ?? r.relationship})`}
                        </Typography>
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          onClick={async () => {
                            try {
                              await api.delete(`/related_users/${r.id}/`);
                              setSnackbarMessage(`${r.name} was removed.`);
                              setSnackbarOpen(true);
                              await refreshUserData();
                            } catch (err) {
                              console.error("Failed to delete related user", err);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </Box>
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body2">No related users yet.</Typography>
              )}

              <Button variant="outlined" onClick={() => setShowAddForm(!showAddForm)} sx={{ mt: 2 }}>
                {showAddForm ? 'Cancel' : 'Add Relationship'}
              </Button>
              {showAddForm && (
                <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Relationship</InputLabel>
                    <Select
                      value={newRelationship}
                      onChange={(e) => setNewRelationship(e.target.value)}
                      label="Relationship"
                    >
                      {RelationshipOptions.map((rel: { value: string; label: string }) => (
                        <MenuItem key={rel.value} value={rel.value}>{rel.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Color</InputLabel>
                    <Select
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      label="Color"
                    >
                      {ColorOptions.map((color) => (
                        <MenuItem key={color.value} value={color.value}>
                          <Box sx={{
                            display: 'inline-block',
                            width: 16,
                            height: 16,
                            backgroundColor: color.value,
                            borderRadius: '50%',
                            marginRight: 1,
                          }} />
                          {color.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={async () => {
                      try {
                        await api.post('/related_users/', {
                          user: user.id,
                          name: newName,
                          relationship: newRelationship,
                          color_code: newColor,
                        });

                        setShowAddForm(false);
                        setNewName('');
                        setNewRelationship('');
                        setNewColor('');

                        await refreshUserData();
                        setSnackbarMessage(`${newName} was added.`);
                        setSnackbarOpen(true);
                      } catch (error) {
                        console.error("Failed to save related user", error);
                      }
                    }}
                  >
                    Save
                  </Button>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3} padding={3}>
          <Grid item xs={12}>
            <VendorVisitList />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} padding={3}>
        <Grid item xs={12}>
          <Box sx={{ width: '100%' }}>
            <Calendar userEvents={calendarEvents} />
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserDetail;