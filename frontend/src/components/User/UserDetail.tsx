import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { Calendar } from './Calendar';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/api';
import { User } from '../../models/user';
import { UserEvent } from '../../models/user_event';
import { ColorCode, ColorOptions } from '../../models/enum';
import { CalendarEvent } from '../../models/calendar';

const UserDetail = () => {
  const { user, loading } = useAuth();
  const [mobilityAid, setMobilityAid] = useState('');
  const [stairPreference, setStairPreference] = useState('');
  const [color_code, setColorCode] = useState('');
  const [message, setMessage] = useState('');
  const theme = useTheme();
  

  if (loading) return <CircularProgress />;
  if (!user) return <Typography>You are not logged in.</Typography>;

 const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
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
            <ul>
              <li>Alice Smith</li>
              <li>Bob Johnson</li>
            </ul>
          </Card>
        </Grid>

        {/* Calendar */}
        <Grid item xs={12}>
          <Box sx={{ width: '100%' }}>
            <Calendar userEvents={calendarEvents} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDetail;