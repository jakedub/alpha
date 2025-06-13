import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'

const ListView = () => {
  return (
    <FullCalendar
        plugins={[ listPlugin ]}
        initialView='listDay'
        events={[
            {title: 'Event 1', start: '2025-08-01'},
            {title: 'Event 2', start: '2025-07-29', end: '2025-08-01'},
            {title: 'Event 3', start: '2025-08-01T12:00:00', allDay: false}
        ]}

        headerToolbar={{
          right: 'listDay,listWeek',
          center: 'title',
          left: 'prev, next'
        }}
        
        views={{
          listDay: { buttonText: 'Day List' },
          listWeek: { buttonText: 'Week List' }
        }}
    />
  );
};

export default ListView;