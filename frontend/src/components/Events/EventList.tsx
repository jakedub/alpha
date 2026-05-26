import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import qs from 'qs';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Snackbar,
  Typography,
  useTheme,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../../api/api';
import { Event } from '../../models/events';
import EventFilter from './EventFilter';
import { Filters } from '../../types/filters';

// ── Event-type color strip palette ─────────────────────────────────────────
const EVENT_TYPE_COLORS: Record<string, string> = {
  'BGM': '#00F0FF',
  'RPG': '#7c3aed',
  'TCG': '#FFA900',
  'SEM': '#00FF81',
  'NMN': '#FF6800',
  'LRP': '#ec4899',
  'MHE': '#06b6d4',
  'WKS': '#f59e0b',
  'EGS': '#84cc16',
  'ANI': '#a855f7',
};

function eventTypeColor(type: string): string {
  return EVENT_TYPE_COLORS[type?.toUpperCase()] ?? '#6b7280';
}

// ── Single event card ────────────────────────────────────────────────────────
function EventCard({
  row,
  selectedEventIds,
  showSnackbar,
  refreshUserEvents,
}: {
  row: Event;
  selectedEventIds: Set<string>;
  showSnackbar: (msg: string) => void;
  refreshUserEvents: () => Promise<void>;
}) {
  const theme = useTheme();
  const isScheduled = selectedEventIds.has(row.game_id?.toString() ?? '');
  const stripColor = eventTypeColor(row.event_type);

  const start = new Date(row.start_time);
  const end = new Date(row.end_time);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const isFree = !row.cost || row.cost === 0;

  const handleAddToSchedule = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isScheduled) { showSnackbar('Already in your schedule'); return; }
    try {
      const res = await api.get('/me/');
      if (res.status !== 200) { showSnackbar('Sign in to add events'); return; }
      await api.post('/user_events/', { event: row.game_id?.toString(), status: 'wishlist' });
      await refreshUserEvents();
      showSnackbar('Added to schedule');
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        showSnackbar('Sign in to add events');
      } else {
        showSnackbar('Something went wrong');
      }
    }
  };

  const handleRemoveFromSchedule = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.get('/user_events/');
      const results = res.data.results ?? res.data;
      const match = results.find((ue: any) => ue.event_game_id === row.game_id?.toString());
      if (!match) { showSnackbar('Event not found in schedule'); return; }
      await api.delete(`/user_events/${match.id}/`);
      await refreshUserEvents();
      showSnackbar('Removed from schedule');
    } catch {
      showSnackbar('Failed to remove event');
    }
  };

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
          borderColor: theme.palette.primary.main,
        },
        ...(isScheduled && {
          borderColor: `${theme.palette.primary.main}88`,
        }),
      }}
    >
      {/* Left color strip */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: stripColor,
          borderRadius: '8px 0 0 8px',
        }}
      />

      <CardActionArea
        component={Link}
        to={`/events/${row.game_id}`}
        sx={{ pl: '12px' }}
      >
        <CardContent sx={{ pb: '12px !important' }}>
          {/* Top row: type badge + cost */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
            <Chip
              label={row.event_type}
              size="small"
              sx={{
                fontSize: '0.65rem',
                height: 20,
                bgcolor: `${stripColor}22`,
                color: stripColor,
                border: `1px solid ${stripColor}55`,
                fontWeight: 600,
              }}
            />
            <Chip
              label={isFree ? 'Free' : `$${row.cost}`}
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                bgcolor: isFree ? `${theme.palette.primary.main}22` : 'transparent',
                color: isFree ? theme.palette.primary.main : theme.palette.text.secondary,
                border: isFree
                  ? `1px solid ${theme.palette.primary.main}55`
                  : `1px solid ${theme.palette.divider}`,
                fontWeight: 600,
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              mb: 1,
              lineHeight: 1.35,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {row.title}
          </Typography>

          {/* Meta row */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {start.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <AccessTimeIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {durationMinutes} min
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <LocationOnIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}
              >
                {row.location?.name ?? '—'}
              </Typography>
            </Box>
          </Box>

          {/* Action button */}
          {isScheduled ? (
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon fontSize="small" />}
              onClick={handleRemoveFromSchedule}
              sx={{ fontSize: '0.75rem' }}
            >
              Scheduled
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={handleAddToSchedule}
              sx={{ fontSize: '0.75rem' }}
            >
              Add to Schedule
            </Button>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ── Main EventList ───────────────────────────────────────────────────────────
const EventList = ({
  events: initialEvents = [],
  onAddToCalendar,
}: {
  events?: Event[];
  onAddToCalendar?: (eventId: number) => void;
}) => {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    eventTypes: [],
    gameSystems: [],
    days: [],
    groups: [],
    locations: [],
    startTimes: [],
    ageRequirements: [],
    experienceLevels: [],
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activeFilterCount = Object.values(filters).flat().length;

  const refreshUserEvents = async () => {
    try {
      const res = await api.get('/user_events/');
      const results = res.data.results ?? [];
      const ids = new Set<string>();
      results.forEach((ue: any) => {
        if (ue.event_game_id) ids.add(ue.event_game_id);
        else if (ue.event != null) ids.add(ue.event.toString());
      });
      setSelectedEventIds(ids);
    } catch {
      // silently ignore — user may not be logged in
    }
  };

  useEffect(() => { refreshUserEvents(); }, []);

  // Fetch on filter change (reset to page 1)
  useEffect(() => {
    const params: Record<string, string | string[] | number> = { page: 1 };
    if (filters.eventTypes.length) params.event_type = filters.eventTypes;
    if (filters.gameSystems.length) params.game_system = filters.gameSystems;
    if (filters.days.length) params.day = filters.days;
    if (filters.groups.length) params.gaming_group = filters.groups;
    if (filters.locations.length) params.location = filters.locations;
    if (filters.startTimes.length) params.start_time = filters.startTimes;
    if (filters.ageRequirements.length) params.minimum_age = filters.ageRequirements;
    if (filters.experienceLevels.length) params.experience_required = filters.experienceLevels;

    api
      .get('/events/', { params, paramsSerializer: (p) => qs.stringify(p, { arrayFormat: 'repeat' }) })
      .then((res) => {
        const newEvents = Array.isArray(res.data?.results)
          ? res.data.results
          : Array.isArray(res.data)
          ? res.data
          : [];
        setEvents(newEvents);
        setHasMore(!!res.data?.next);
        setTotalCount(res.data?.count ?? 0);
        setPage(1);
      })
      .catch(() => setError('Failed to load events.'));
  }, [filters]);

  // Load more (append)
  useEffect(() => {
    if (page === 1) return;
    const params: Record<string, string | string[] | number> = { page };
    if (filters.eventTypes.length) params.event_type = filters.eventTypes;
    if (filters.gameSystems.length) params.game_system = filters.gameSystems;
    if (filters.days.length) params.day = filters.days;
    if (filters.groups.length) params.gaming_group = filters.groups;
    if (filters.locations.length) params.location = filters.locations;
    if (filters.startTimes.length) params.start_time = filters.startTimes;
    if (filters.ageRequirements.length) params.minimum_age = filters.ageRequirements;
    if (filters.experienceLevels.length) params.experience_required = filters.experienceLevels;

    api
      .get('/events/', { params, paramsSerializer: (p) => qs.stringify(p, { arrayFormat: 'repeat' }) })
      .then((res) => {
        const newEvents = Array.isArray(res.data?.results) ? res.data.results : [];
        setEvents((prev) => [...prev, ...newEvents]);
        setHasMore(!!res.data?.next);
        setLoadingMore(false);
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      })
      .catch(() => setError('Failed to load more events.'));
  }, [page]);

  const showSnackbar = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
      {/* Filter sidebar */}
      <EventFilter events={events} filters={filters} onFilterChange={setFilters} />

      {/* Results */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>Events</Typography>
          <Typography variant="body2" color="text.secondary">
            {totalCount.toLocaleString()} results
            {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
          </Typography>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        )}

        {/* Card grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 2,
          }}
        >
          {events.map((event) => (
            <EventCard
              key={`${event.game_id}-${event.start_time}`}
              row={event}
              selectedEventIds={selectedEventIds}
              showSnackbar={showSnackbar}
              refreshUserEvents={refreshUserEvents}
            />
          ))}
        </Box>

        <div ref={scrollRef} />

        {/* Load more */}
        {hasMore && (
          <Box textAlign="center" mt={3}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setPage((prev) => prev + 1);
                setLoadingMore(true);
              }}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export const EventTable = ({
  events,
  onAddToCalendar,
}: {
  events: Event[];
  onAddToCalendar?: (eventId: number) => void;
}) => <EventList events={events} onAddToCalendar={onAddToCalendar} />;

export default EventList;
