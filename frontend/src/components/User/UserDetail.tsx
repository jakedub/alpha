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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import TextField from '@mui/material/TextField';
import { Calendar } from './Calendar';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/api';
import { User } from '../../models/user';
import { UserEvent } from '../../models/user_event';
import { RelatedUser } from '../../models/related_user';
import { ColorCode, ColorOptions, RelationshipOptions } from '../../models/enum';
import { CalendarEvent } from '../../models/calendar';
import { UserWatchedEvent } from '../../models/user_watched_event';
// Define UserWatchedEvent type inline if not available in models

const UserDetail = () => {
  const { user, loading, setUser } = useAuth();
  const [mobilityAid, setMobilityAid] = useState('');
  const [stairPreference, setStairPreference] = useState('');
  const [color_code, setColorCode] = useState('');
  const [message, setMessage] = useState('');
  const theme = useTheme();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [newColor, setNewColor] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');


  const refreshUserData = async () => {
    try {
      const updatedUser = await api.get(`/users/${user?.id}/`);
      console.log("[🔄] Refreshed user data:", updatedUser.data);
      if (setUser) {
        setUser(updatedUser.data);
      }
    } catch (error) {
      console.error("Failed to refresh user data", error);
    }
  };

  if (loading) return <CircularProgress />;
  if (!user) return <Typography>You are not logged in.</Typography>;

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  useEffect(() => {
    if (user) {
      setMobilityAid(user.mobility_aid || '');
      setStairPreference(user.stair_preference || '');
      setColorCode(user.color_code || '');
    }
  }, [user]);
  useEffect(() => {
    if (user?.user_events) {
      const events = user.user_events.map((ue: UserEvent) => ({
        title: ue.event_title,
        description: ue.event_short_description,
        start: new Date(ue.event_start_time),
        end: new Date(ue.event_end_time),
        category: ue.status,
        color: user.color_code || '#1976d2'
      }));
      setCalendarEvents(events);
    }
  }, [user]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting:", {
      mobility_aid: mobilityAid,
      stair_preference: stairPreference,
      color_code: color_code
    });

    try {
      const response = await api.patch(`/users/${user?.id}/`, {
        mobility_aid: mobilityAid || null,
        stair_preference: stairPreference || null,
        color_code: color_code || null
      });

      setMessage('Preferences updated successfully!');

      // 🔁 Regenerate the calendar events using the new color_code
      const updatedEvents = user.user_events?.map((ue: UserEvent) => ({
        title: ue.event_title,
        description: ue.event_short_description,
        start: new Date(ue.event_start_time),
        end: new Date(ue.event_end_time),
        category: ue.status,
        color: color_code || '#1976d2',
      })) ?? [];

      setCalendarEvents(updatedEvents); // ✅ this will re-render the calendar with new colors

    } catch {
      setMessage('Error updating preferences.');
    }
  };

  const [watchList, setWatchList] = useState<UserWatchedEvent[]>([]);
  const [newId, setNewId] = useState('');

  const addWatchedEvent = () => {
    // Retrieve token from localStorage or context
    const token = localStorage.getItem('token');
    fetch('/api/user-watched-events/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ gencon_event_id: newId })
    })
      .then(res => res.json())
      .then(event => {
        setWatchList(prev => [...prev, event]);
        setNewId('');
      });
  };


  return (
    <Box sx={{ overflowX: 'hidden', width: '75vw', margin: '0 auto', padding: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4">Event Agenda</Typography>
      </Box>
      <Grid container spacing={3} padding={3}>
        {/* Agenda Table */}
        <Grid item xs={12} md={8}>
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

        {/* Preferences Form */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card sx={{ padding: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6">Update Preferences: {user.username}</Typography>
            {message && <Typography>{message}</Typography>}
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
              </FormControl >
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

          <Card sx={{ padding: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6">Friends and Family</Typography>
            {(() => {
              return user.related_users && user.related_users.length > 0 ? (
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
              );
            })()}
          </Card>

          <Button variant="outlined" onClick={() => setShowAddForm(!showAddForm)}>
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
          <Box>
            <TextField label="Gen Con Event ID" value={newId} onChange={(e) => setNewId(e.target.value)} />
            <Button onClick={addWatchedEvent}>Watch</Button>
          </Box>
          <List>
            {watchList.map(ev => (
              <ListItem key={ev.id}>
                <ListItemText
                  primary={ev.gencon_event_id}
                  secondary={ev.last_known_status ? '✅ Available' : '❌ Unavailable'}
                />
              </ListItem>
            ))}
          </List>
        </Grid>

        {/* Calendar */}
        <Grid item xs={12}>
          <Box sx={{ width: '100%' }}>
            <Calendar userEvents={calendarEvents} />
          </Box>
        </Grid>
      </Grid>
      {/* Snackbar for related user actions */}
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