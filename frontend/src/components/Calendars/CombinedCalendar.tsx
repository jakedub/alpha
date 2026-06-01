import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventInput, EventClickArg } from '@fullcalendar/core';
import listPlugin from '@fullcalendar/list';
import '../Calendars/CalendarColors.css';
import '../Calendars/CalendarTheme.css';
import InteractionPlugin from '@fullcalendar/interaction';
import { DateClickArg } from '@fullcalendar/interaction';
import type { EventModalData } from '../Shared/Modal';

interface CombinedCalendarProps {
  events: EventInput[];
  dayClickAction?: (arg: DateClickArg) => void;
  onEventClick?: (data: EventModalData) => void;
}

const CombinedCalendar: React.FC<CombinedCalendarProps> = ({ events, dayClickAction, onEventClick }) => {
  const handleEventClick = (arg: EventClickArg) => {
    const { title, start, end, extendedProps } = arg.event;

    const relatedUsers: { name: string }[] = extendedProps.user ?? [];
    const attendees: string[] = [
      ...(extendedProps.self_assigned ? ['You'] : []),
      ...relatedUsers.map((u: any) => u.name),
    ];

    onEventClick?.({
      title,
      gameId:      extendedProps.event_game_id ?? '',
      start:       start ?? new Date(),
      end:         end   ?? new Date(),
      location:    extendedProps.event_location ?? '',
      room:        extendedProps.event_room     ?? null,
      description: extendedProps.description   ?? '',
      status:      extendedProps.status        ?? '',
      attendees,
      userEventId: arg.event.id ? Number(arg.event.id) : undefined,
    });
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, InteractionPlugin]}
      initialView="timeGridWeek"
      initialDate="2026-07-30"
      visibleRange={{ start: '2026-07-30', end: '2026-08-05' }}
      events={events}
      eventClick={handleEventClick}
      dateClick={dayClickAction}
      headerToolbar={{
        left:   'prev,next today',
        center: 'title',
        right:  'timeGridWeek,timeGridDay',
      }}
      firstDay={3}
      hiddenDays={[1, 2]}
      eventClassNames={(arg) => arg.event.classNames}
      eventDidMount={(info) => {
        if (info.event.extendedProps.status === 'wishlist') {
          info.el.style.opacity = '0.35';
        }
      }}
      eventContent={(arg) => {
        const loc  = arg.event.extendedProps.event_location as string | undefined;
        const room = arg.event.extendedProps.event_room     as string | undefined;

        const subtitle = [loc, room].filter(Boolean).join(' · ');

        return (
          <div style={{
            padding: '2px 5px',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            cursor: 'pointer',
          }}>
            <div style={{
              fontWeight: 700,
              fontSize: '0.78rem',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {arg.event.title}
            </div>
            {subtitle && (
              <div style={{
                fontSize: '0.67rem',
                opacity: 0.8,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.25,
                marginTop: 1,
              }}>
                {subtitle}
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

export default CombinedCalendar;
