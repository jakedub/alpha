import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import qs from 'qs';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import api from '../../api/api';
import { Event } from '../../models/events';
import EventFilter, { DEFAULT_FILTERS } from './EventFilter';
import { Filters } from '../../types/filters';

type RelatedUser = { id: number; name: string; color_code: string; relationship: string };
type UserEventEntry = { id: number; status: string };

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
  selectedEventStatuses,
  showSnackbar,
  refreshUserEvents,
  relatedUsers,
}: {
  row: Event;
  selectedEventStatuses: Map<string, UserEventEntry>;
  showSnackbar: (msg: string) => void;
  refreshUserEvents: () => Promise<void>;
  relatedUsers: RelatedUser[];
}) {
  const theme = useTheme();
  const gameIdStr = row.game_id?.toString() ?? '';
  const scheduledEntry = selectedEventStatuses.get(gameIdStr);
  const isScheduled = !!scheduledEntry;
  const stripColor = eventTypeColor(row.event_type);

  const start = new Date(row.start_time);
  const end = new Date(row.end_time);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const isFree = !row.cost || row.cost === 0;

  // "Who is this for?" dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [forSelf, setForSelf] = useState(true);
  const [forRelated, setForRelated] = useState<Set<number>>(new Set());

  const toggleRelated = (id: number) => {
    setForRelated((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // pendingStatus is set when the dialog is opened so we know which status to POST
  const [pendingStatus, setPendingStatus] = useState<'wishlist' | 'purchased'>('wishlist');

  const doAdd = async (status: 'wishlist' | 'purchased', selfAssigned: boolean, relatedUserIds: number[]) => {
    try {
      await api.post('/user_events/', {
        event: gameIdStr,
        status,
        self_assigned: selfAssigned,
        related_user_ids: relatedUserIds,
      });
      await refreshUserEvents();
      showSnackbar(status === 'purchased' ? 'Added as purchased' : 'Added to wishlist');
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        showSnackbar('Sign in to add events');
      } else {
        showSnackbar('Something went wrong');
      }
    }
  };

  const handleAddToSchedule = async (e: React.MouseEvent, status: 'wishlist' | 'purchased') => {
    e.preventDefault();
    e.stopPropagation();
    if (isScheduled) { showSnackbar('Already in your schedule'); return; }
    try {
      await api.get('/me/');
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        showSnackbar('Sign in to add events');
      }
      return;
    }
    if (relatedUsers.length === 0) {
      await doAdd(status, true, []);
    } else {
      setPendingStatus(status);
      setForSelf(true);
      setForRelated(new Set());
      setDialogOpen(true);
    }
  };

  const handleDialogConfirm = async () => {
    setDialogOpen(false);
    if (!forSelf && forRelated.size === 0) { showSnackbar('Select at least one person'); return; }
    await doAdd(pendingStatus, forSelf, Array.from(forRelated));
  };

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!scheduledEntry) return;
    const newStatus = scheduledEntry.status === 'purchased' ? 'wishlist' : 'purchased';
    try {
      await api.patch(`/user_events/${scheduledEntry.id}/`, { status: newStatus });
      await refreshUserEvents();
      showSnackbar(newStatus === 'purchased' ? 'Marked as purchased' : 'Moved to wishlist');
    } catch {
      showSnackbar('Failed to update status');
    }
  };

  const handleRemoveFromSchedule = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!scheduledEntry) return;
    try {
      await api.delete(`/user_events/${scheduledEntry.id}/`);
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

          {/* Action buttons */}
          {isScheduled ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                label={scheduledEntry?.status === 'purchased' ? 'Purchased' : 'Wishlist'}
                size="small"
                icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
                sx={{
                  fontSize: '0.68rem',
                  height: 22,
                  fontWeight: 600,
                  bgcolor: scheduledEntry?.status === 'purchased'
                    ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)',
                  color: scheduledEntry?.status === 'purchased' ? '#34d399' : '#f59e0b',
                  border: 'none',
                }}
              />
              <Tooltip title={scheduledEntry?.status === 'purchased' ? 'Move to wishlist' : 'Mark as purchased'}>
                <IconButton size="small" onClick={handleToggleStatus} sx={{ color: 'text.secondary', p: 0.5 }}>
                  <SwapHorizIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove from schedule">
                <IconButton size="small" onClick={handleRemoveFromSchedule} color="error" sx={{ p: 0.5 }}>
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => handleAddToSchedule(e, 'wishlist')}
                sx={{ fontSize: '0.72rem', py: 0.25 }}
              >
                + Wishlist
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={(e) => handleAddToSchedule(e, 'purchased')}
                sx={{ fontSize: '0.72rem', py: 0.25 }}
              >
                Add
              </Button>
            </Box>
          )}
        </CardContent>
      </CardActionArea>

      {/* "Who is this for?" dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{ sx: { minWidth: 280, borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>Who is this for?</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <FormControlLabel
            control={<Checkbox checked={forSelf} onChange={(e) => setForSelf(e.target.checked)} size="small" />}
            label={<Typography variant="body2" fontWeight={600}>Me</Typography>}
          />
          {relatedUsers.map((ru) => (
            <Box key={ru.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                checked={forRelated.has(ru.id)}
                onChange={() => toggleRelated(ru.id)}
                size="small"
              />
              <Avatar sx={{ width: 20, height: 20, bgcolor: ru.color_code, fontSize: '0.6rem' }}>
                {ru.name[0]}
              </Avatar>
              <Typography variant="body2">{ru.name}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleDialogConfirm}
            disabled={!forSelf && forRelated.size === 0}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
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
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedEventStatuses, setSelectedEventStatuses] = useState<Map<string, UserEventEntry>>(new Map());
  const [relatedUsers, setRelatedUsers] = useState<RelatedUser[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Debounce free-text search by 400 ms so we don't fire on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(id);
  }, [filters.search]);

  const activeFilterCount = Object.values(filters).flat().length;

  const refreshUserEvents = async () => {
    try {
      const res = await api.get('/user_events/');
      const results = res.data.results ?? [];
      const statuses = new Map<string, UserEventEntry>();
      results.forEach((ue: any) => {
        const gameId = ue.event_game_id ?? ue.event?.toString();
        if (gameId) statuses.set(gameId, { id: ue.id, status: ue.status });
      });
      setSelectedEventStatuses(statuses);
    } catch {
      // silently ignore — user may not be logged in
    }
  };

  useEffect(() => { refreshUserEvents(); }, []);

  useEffect(() => {
    api.get('/related_users/').then((res) => {
      const results = res.data.results ?? res.data ?? [];
      setRelatedUsers(results);
    }).catch(() => {/* not logged in or no related users */});
  }, []);

  // Fetch on filter change (reset to page 1)
  useEffect(() => {
    const params: Record<string, string | string[] | number> = { page: 1 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.gameId) params.game_id = filters.gameId;
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
  }, [debouncedSearch, filters.gameId, filters.eventTypes, filters.gameSystems, filters.days, filters.groups, filters.locations, filters.startTimes, filters.ageRequirements, filters.experienceLevels]);

  // Load more (append)
  useEffect(() => {
    if (page === 1) return;
    const params: Record<string, string | string[] | number> = { page };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.gameId) params.game_id = filters.gameId;
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
              selectedEventStatuses={selectedEventStatuses}
              showSnackbar={showSnackbar}
              refreshUserEvents={refreshUserEvents}
              relatedUsers={relatedUsers}
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
