import React, { useState } from 'react';
import { Box, Button, Container, ButtonGroup } from '@mui/material';
import MyCalendar1 from '../Calendars/MyCalendar1';
import ListView from '../Calendars/ListView';
import CombinedCalendar from '../Calendars/CombinedCalendar';

const Calendar1 = () => {
  const [view, setView] = useState<'calendar1' | 'calendar2' | 'list'>('calendar1');

  return (
    <Container maxWidth={false} sx={{ width: '75vw' }}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <ButtonGroup variant="contained">
          <Button onClick={() => setView('calendar1')}>Calendar 1</Button>
          <Button onClick={() => setView('calendar2')}>Calendar 2</Button>
          <Button onClick={() => setView('list')}>List View</Button>
        </ButtonGroup>
      </Box>

      {view === 'calendar1' && <MyCalendar1 />}
      {view === 'calendar2' && <CombinedCalendar events={[]} />}
      {view === 'list' && <ListView />}
    </Container>
  );
};

export default Calendar1;