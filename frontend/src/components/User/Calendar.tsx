import {
  Calendar as BigCalendar,
  CalendarProps,
  momentLocalizer,
  Views
} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import { useState } from 'react';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  category?: string;
}

interface Props {
  userEvents: CalendarEvent[];
}

export const Calendar = ({ userEvents }: Props) => {
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.AGENDA);
  const [date, setDate] = useState(moment("2025-07-31").toDate());
  

  return (
    <div style={{ height: '100vh', width: '100%' }}>
        <BigCalendar
        localizer={localizer}
        date={date}
        onNavigate={(newDate) => setDate(newDate)}
        defaultDate={date} // optional once `date` is used
        scrollToTime={moment("2025-08-01T08:00:00").toDate()} // e.g., scroll to 8 AM
        min={moment("2025-07-30T00:00:00").toDate()}
        max={moment("2025-08-03T23:59:00").toDate()}
        view={view}
        onView={setView}
        views={['week', 'day', 'agenda']}
        events={userEvents}
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