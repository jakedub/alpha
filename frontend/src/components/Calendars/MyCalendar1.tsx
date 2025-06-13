import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const MyCalendar1 = () => {

    // dayGridDay, dayGridWeek, dayGridMonth, dayGridYear - list and time repeat this
  return (
    <FullCalendar
        plugins={[ dayGridPlugin ]}
        initialView='dayGridMonth'
        eventBackgroundColor='red'
        events={[
            {title: 'Event 1', start: '2025-08-01'},
            {title: 'Event 2', start: '2025-07-29', end: '2025-08-01'},
            {title: 'Event 3', start: '2025-08-01T12:00:00', allDay: false}
        ]}
    />
  );
};

export default MyCalendar1;