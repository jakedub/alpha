import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import { EventTable } from '../Events/EventList';
import api from '../../api/api'; // make sure this path is correct
import {Event} from '../../models/events'

const Scheduler = () => {
  const [events, setEvents] = useState<Event[]>([]);

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

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <h1>User Calendar</h1>
        {/* Add your calendar here */}
      </Grid>
      <Grid item xs={12} md={6}>
        <h1>All Events</h1>
        <EventTable events={events} />
      </Grid>
    </Grid>
  );
};

export default Scheduler;