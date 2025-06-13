import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventInput, EventClickArg } from '@fullcalendar/core'; // Import this for typing
import { Box, Container, Typography,  Modal} from '@mui/material';
import listPlugin from '@fullcalendar/list';
import '../Calendars/CalendarColors.css';
import { useNavigate } from 'react-router-dom';
import InteractionPlugin from '@fullcalendar/interaction';
import { DateClickArg } from '@fullcalendar/interaction';

interface CombinedCalendarProps {
  events: EventInput[];
  dayClickAction?: (arg: DateClickArg) => void;
  onEventClick?: (title: string, description: string) => void;
}

const CombinedCalendar: React.FC<CombinedCalendarProps> = ({ events, dayClickAction, onEventClick }) => {
  const navigate = useNavigate();
  const eventClickAction = (data: EventClickArg) => {
    const { title, start, extendedProps } = data.event;
    const formattedStart = start?.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const eventLocation = extendedProps.event_location || 'TBD';
    const link = `/events/${extendedProps.event_game_id}`;
    const relatedUsers = extendedProps.user || [];
    const selfAssignedUser = extendedProps.self_assigned ? [{ name: 'You' }] : [];
    const event_group = [...selfAssignedUser, ...relatedUsers];

    const description = `Starts: ${formattedStart}\nLocation: ${eventLocation}\nUsers Attending: ${event_group.map((user: any) => user.name).join(', ')}\nDetails: ${link}`;

    onEventClick?.(title, description);
  }


  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, InteractionPlugin]}
      initialView='timeGridWeek'
      initialDate='2025-07-30'
      visibleRange={{
        start: '2025-07-30',
        end: '2025-08-05',
      }}
      events={events}
      eventClick={eventClickAction}
      dateClick={dayClickAction}
      eventDidMount={(info)=> {
        const related_user = info.event.extendedProps.related_user;
      }}
      headerToolbar={{
        right: 'timeGridWeek,timeGridDay, listWeek',
        center: 'title'
      }}
      firstDay={3} // 0=Sunday, 1=Monday, ..., 3=Wednesday
      hiddenDays={[1, 2]} // hide Monday and Tuesday
      eventClassNames={(arg) => arg.event.classNames}
    />
  );
};

export default CombinedCalendar;