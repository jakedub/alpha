import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Divider, Grid, Typography } from '@mui/material';
import { EventTable } from '../Events/EventList';
import api from '../../api/api';
import { UserEvent } from '../../models/user_event';
import { useAuth } from '../../auth/AuthContext';
import moment from 'moment';
import { CalendarEvent } from '../../models/calendar';
import { EventInput } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import CombinedCalendar from '../Calendars/CombinedCalendar';
import MultiSelectForm from '../Forms/MultiSelectForm';
import EventDetailModal, { type EventModalData } from './Modal';

interface CombinedCalendarProps {
  events: EventInput[];
  dayClickAction?: (arg: DateClickArg) => void;
}

const Calendar2 = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<EventInput[]>([]);
  const [globalEvents, setGlobalEvents] = useState<Event[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventModalData | null>(null);

  const handleOpen = (data: EventModalData) => {
    setSelectedEvent(data);
    setOpen(true);
  };
  const { user } = useAuth();

  // useEffect(() => {
  //   api.get('/events/')
  //     .then((res) => {
  //       const data = Array.isArray(res.data.results) ? res.data.results : [];
  //       setEvents(data);
  //     })
  //     .catch((err) => {
  //       console.error('Failed to load events', err);
  //       setEvents([]);
  //     });
  // }, []);

  type ExtendedUserEvent = UserEvent & {
    self_assigned: boolean;
    related_users?: {
      color_code: any; id: number; name: string 
}[];
    classNames?: string[];
  };

useEffect(() => {
  if (user?.user_events) {

    const transformed: EventInput[] = (user.user_events as ExtendedUserEvent[]).map((ue) => ({
      id: String(ue.id),
      title: ue.event_title,
      description: ue.event_short_description,
      start: new Date(ue.event_start_time),
      end: new Date(ue.event_end_time),
      status: ue.status,
      classNames: ue.classNames,
      self_assigned: ue.self_assigned,
      event_game_id: ue.event_game_id,
      extendedProps: {
        event_game_id:  ue.event_game_id,
        description:    ue.event_short_description,
        status:         ue.status,
        user:           (ue as any).related_users,
        self_assigned:  ue.self_assigned,
        event_location: ue.event_location,
        event_room:     ue.event_room ?? null,
      },
      related_user_ids: ue.related_users?.map((ru: any) => String(ru.id)) || []
    }));
    setEvents(transformed);

    // [🔍 Event Assignment Check]
    user.user_events.forEach((ue: any) => {
      console.log({
        event_id: ue.id,
        title: ue.event_title,
        self_assigned: ue.self_assigned,
        location: ue.event_location,
        related_user_ids: ue.related_users?.map((ru: any) => ru.id),
      });
    });

    console.log('[🎨 ClassName Assignment]');
    (user.user_events as ExtendedUserEvent[]).forEach((ue) => {
      const selfAssigned = ue.self_assigned;
      const related = ue.related_users || [];
      const color = selfAssigned && related.length
        ? '#00F0FF'
        : selfAssigned
          ? user?.color_code
          : related[0]?.color_code;

      const className = `user-color-${color?.replace('#', '')}`;

      console.log({
        event_id: ue.id,
        title: ue.event_title,
        location: ue.event_location,
        self_assigned: selfAssigned,
        related_users: related.map((r) => ({ name: r.name, color: r.color_code })),
        user: { name: user?.username, color: user?.color_code },
        classNameAssigned: className
      });
    });

    const statuses = Array.from(new Set(user.user_events.map((ue: { status: any; }) => ue.status)));
    const formattedOptions = statuses.map(
      (status): { value: string; label: string } => ({
        value: String(status),
        label: String(status),
      })
    );
    setCategoryOptions(formattedOptions);
    
    if (user) {
      const relatedOptions = user.related_users?.map((ru: any) => ({
        value: String(ru.id),
        label: ru.name,
      })) || [];

      const fullOptions = [
        { value: String(user.id), label: user.username }, // 👈 add user
        ...relatedOptions,
      ];

      setUserOptions(fullOptions);
    }
  }
}, [user]);

const filteredEvents = events.filter((event: any) => {
  const assignedToIds: string[] = [];

  if (event.self_assigned) {
    assignedToIds.push(String(user?.id));
  }
  if (event.related_user_ids) {
    assignedToIds.push(...event.related_user_ids);
  }

  return selectedUserIds.some(id => assignedToIds.includes(id));
});
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
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

      {/* Filter bar */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="overline" color="text.secondary" fontWeight={600}
            sx={{ letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
            Filters
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 200 }}>
              <MultiSelectForm label="Category" options={categoryOptions} />
            </Box>
            <Box sx={{ minWidth: 200 }}>
              {(() => {
                const defaultUserOption = user
                  ? [{ value: String(user.id), label: user.username }]
                  : [];
                return (
                  <MultiSelectForm
                    label="Users"
                    options={userOptions}
                    defaultValues={defaultUserOption.map((opt) => opt.value)}
                    onChange={setSelectedUserIds}
                  />
                );
              })()}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <CombinedCalendar
            events={selectedUserIds.length ? filteredEvents : events}
            dayClickAction={() => {}}
            onEventClick={(data) => handleOpen(data)}
          />
        </CardContent>
      </Card>

      <EventDetailModal
        open={open}
        setOpen={setOpen}
        event={selectedEvent}
      />
    </Box>
  );
};

export default Calendar2;