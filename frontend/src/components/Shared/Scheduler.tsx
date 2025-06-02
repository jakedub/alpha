import React, { useEffect, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { EventTable } from '../Events/EventList';
import api from '../../api/api'; 
import { UserEvent } from '../../models/user_event';
import { useAuth } from '../../auth/AuthContext';
import moment from 'moment';
import { CalendarEvent } from '../../models/calendar';
import { Event } from '../../models/events'; 
import { Calendar } from '../User/Calendar';
import { momentLocalizer } from 'react-big-calendar';

const Scheduler = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const { user } = useAuth();
  const localizer = momentLocalizer(moment);

  useEffect(() => {
    api.get('/events/')
      .then((res) => {
        const data = Array.isArray(res.data.results) ? res.data.results : [];
        setEvents(data);
      })
      .catch((err) => {
        console.error('Failed to load events', err);
        setEvents([]);
      });
  }, []);

  useEffect(() => {
    if (user?.user_events) {
      const transformed = user.user_events.map((ue: UserEvent) => ({
        title: ue.event_title,
        description: ue.event_short_description,
        start: new Date(ue.event_start_time),
        end: new Date(ue.event_end_time),
        category: ue.status,
        color: user.color_code || '#1976d2',
      }));
      setCalendarEvents(transformed);
    }
  }, [user]);

  const handleAddToCalendar = async (eventId: number) => {
    try {
      const response = await api.post('/user_events/', {
        event: eventId,
        status: 'wishlist',
      });

      const ue = response.data;

      const newCalendarEvent: CalendarEvent = {
        title: ue.event_title,
        description: ue.event_short_description,
        start: new Date(ue.event_start_time),
        end: new Date(ue.event_end_time),
        category: ue.status,
        color: user?.color_code || '#1976d2',
      };

      setCalendarEvents((prev) => [...prev, newCalendarEvent]);
    } catch (err) {
      console.error('Failed to add event', err);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <h1>User Calendar</h1>
        <Box sx={{ width: '100%' }}>
          <Calendar userEvents={calendarEvents} />
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <h1>All Events</h1>
        <EventTable events={events} onAddToCalendar={handleAddToCalendar} />
      </Grid>
    </Grid>
  );
};

export default Scheduler;