import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/api';
import { EventTable } from '../Events/EventList';
import { Calendar } from '../User/Calendar';
import { UserEvent } from '../../models/user_event';
import { CalendarEvent } from '../../models/calendar';
import { User } from '../../models/user';

interface RelatedProfile extends User {}

const CombinedScheduler = () => {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [relatedProfiles, setRelatedProfiles] = useState<RelatedProfile[]>([]);
  const [calendarMap, setCalendarMap] = useState<Record<string, CalendarEvent[]>>({});
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch related profiles (mock or replace with real API)
    api.get('/related_profiles/')
      .then((res) => {
        const profiles = res.data || [];
        setRelatedProfiles(profiles);
        const allProfiles = [user, ...profiles];

        const newCalendarMap: Record<string, CalendarEvent[]> = {};

        allProfiles.forEach((person: User) => {
          const calendarEvents = (person?.user_events || []).map((ue: UserEvent) => ({
            title: ue.event_title,
            description: ue.event_short_description,
            start: new Date(ue.event_start_time),
            end: new Date(ue.event_end_time),
            category: ue.status,
            color: person.color_code || '#1976d2',
          }));

          if (person.id) {
            newCalendarMap[`${person.id}`] = calendarEvents;
          }
        });

        // Combine all for "All" tab
        const combined = Object.values(newCalendarMap).flat();
        newCalendarMap['all'] = combined;

        setCalendarMap(newCalendarMap);
      })
      .catch((err) => {
        console.error('Failed to load related profiles:', err);
      });

    // Fetch all events
    api.get('/events/')
      .then((res) => {
        setEvents(Array.isArray(res.data?.results) ? res.data.results : []);
      })
      .catch((err) => {
        console.error('Failed to load events:', err);
      });
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const currentTabKey = tabIndex === 0
    ? 'all'
    : tabIndex === 1
    ? `${user?.id}`
    : `${relatedProfiles[tabIndex - 2]?.id}`;

  return (
    <Box sx={{ padding: 2 }}>
      {/* Filter Area */}
      <Paper elevation={2} sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h6">Filters (coming soon)</Typography>
      </Paper>

      <Grid container spacing={2}>
        {/* Tabs + Calendar */}
        <Grid item xs={12} md={7}>
          <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="All" />
            <Tab label="You" />
            {relatedProfiles.map((p) => (
              <Tab key={p.id} label={p.username || `User ${p.id}`} />
            ))}
          </Tabs>

          <Box sx={{ mt: 2 }}>
            <Calendar userEvents={calendarMap[currentTabKey] || []} />
          </Box>
        </Grid>

        {/* Event List */}
        <Grid item xs={12} md={5}>
          <Typography variant="h6" gutterBottom>All Events</Typography>
          <EventTable events={events} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CombinedScheduler;