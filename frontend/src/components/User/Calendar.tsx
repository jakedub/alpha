import {
  Calendar as BigCalendar,
  momentLocalizer,
  Views,
} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventDetailModal, { type EventModalData } from '../Shared/Modal';

const localizer = momentLocalizer(moment);

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  category?: string;
  color?: string;
  note?: string;
  location?: string;
  gameId?: string;
}

interface Props {
  userEvents: CalendarEvent[];
}

// ── Agenda event row ──────────────────────────────────────────────────────────

function AgendaEvent({ event }: { event: CalendarEvent }) {
  const color = event.color ?? '#1976d2';
  const desc = event.note ?? event.description;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        borderLeft: `3px solid ${color}`,
        borderRadius: '0 6px 6px 0',
        pl: 1.25,
        py: 0.75,
        gap: 0.4,
        minWidth: 0,
        width: '100%',
      }}
    >
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ color: '#f9fafb', lineHeight: 1.35 }}
      >
        {event.title}
      </Typography>

      {event.location && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <LocationOnIcon sx={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }} />
          <Typography
            component="span"
            sx={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: 1.3 }}
          >
            {event.location}
          </Typography>
        </Box>
      )}

      {desc && (
        <Typography
          component="span"
          sx={{
            fontSize: '0.7rem',
            color: '#6b7280',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {desc}
        </Typography>
      )}
    </Box>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export const Calendar = ({ userEvents }: Props) => {
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.AGENDA);
  const [date, setDate] = useState(moment('2026-07-30').toDate());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventModalData | null>(null);

  const handleSelectEvent = (event: CalendarEvent) => {
    // Split "Building · Room" back into separate fields for the modal
    const parts = event.location?.split(' · ') ?? [];
    const location = parts[0] ?? '';
    const room     = parts[1] ?? null;

    setSelectedEvent({
      title:       event.title,
      gameId:      event.gameId ?? '',
      start:       event.start,
      end:         event.end,
      location,
      room,
      description: event.note ?? event.description ?? '',
      status:      event.category,
      attendees:   [],
    });
    setModalOpen(true);
  };

  return (
    <>
      <div style={{ height: '100vh', width: '100%' }}>
        <BigCalendar
          localizer={localizer}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          defaultDate={date}
          scrollToTime={moment('2026-08-02T08:00:00').toDate()}
          min={moment('2026-07-30T00:00:00').toDate()}
          max={moment('2026-08-03T23:59:00').toDate()}
          view={view}
          onView={setView}
          views={['week', 'day', 'agenda']}
          events={userEvents}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.color ?? '#f59e0b',
              color: '#111827',
              borderRadius: '8px',
              padding: '4px 8px',
              border: '1.5px solid rgba(255,255,255,0.35)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '6px',
            },
          })}
          components={{
            agenda: {
              event: AgendaEvent,
            },
          }}
        />
      </div>

      <EventDetailModal
        open={modalOpen}
        setOpen={setModalOpen}
        event={selectedEvent}
      />
    </>
  );
};
