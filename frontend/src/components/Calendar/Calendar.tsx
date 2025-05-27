import {
  Calendar as BigCalendar,
  CalendarProps,
  momentLocalizer,
  Views
} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../Calendar/Calendar.css';
import { useState } from 'react';

const localizer = momentLocalizer(moment);

export const Calendar = (props: Omit<CalendarProps, 'localizer'>) => {
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH);
  const [date, setDate] = useState(moment("2025-08-01").toDate());

  const events = [
    {
        title: 'Meeting with team',
        description: 'Discuss project updates and timelines.',
        start: new Date(2025, 7, 2, 14, 0),
        end: new Date(2025, 7, 2, 15, 30),
        allDay: false,
        category: 'Engineering',
        },
    {
      title: 'Design Review',
      description: 'Review the new mockups for client feedback.',
      start: new Date(2025, 7, 3, 10, 0),
      end: new Date(2025, 7, 3, 11, 0),
        allDay: false,
        category: 'Design',
    },
  ];

  return (
    <div style={{ height: '100vh', width: '150vh' }}>
        <BigCalendar
        {...props}
        localizer={localizer}
        date={date}
        onNavigate={(newDate) => setDate(newDate)}
        defaultDate={date} // optional once `date` is used
        scrollToTime={moment("2025-08-01T08:00:00").toDate()} // e.g., scroll to 8 AM
        min={moment("2025-08-01T00:00:00").toDate()} // midnight
        max={moment("2025-08-01T23:59:00").toDate()} // just before midnight
        view={view}
        onView={setView}
        views={['month', 'week', 'day', 'agenda']}
        events={events}
        startAccessor="start"
        endAccessor="end"
        eventPropGetter={(event) => {
          let backgroundColor = '#1976d2';

          if (event.category === 'Design') {
            backgroundColor = '#9c27b0';
          } else if (event.category === 'Engineering') {
            backgroundColor = '#388e3c';
          } else if (event.category === 'Marketing') {
            backgroundColor = '#f57c00';
          }

          return {
            style: {
              backgroundColor,
              color: 'white',
              borderRadius: '4px',
              padding: '4px 8px',
            },
          };
        }}
        components={{
          agenda: {
            event: ({ event }) => (
              <span>
                <strong>{event.title}</strong>
                <br />
                <em>{event.description || 'No description.'}</em>
              </span>
            ),
          },
        }}
        />
    </div>
  );
};