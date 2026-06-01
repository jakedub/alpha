import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { UserWatchedEvent } from '../../models/user_watched_event';
import api from '../../api/api';

type Event = {
  id: number;
  title: string;
  game_id: string;
};

// Gen Con runs Wed–Sun; sort in convention order
const DAY_ORDER = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getDayLabel(startTime: string | undefined): string {
  if (!startTime) return 'Unknown';
  const d = new Date(startTime);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

function groupByDay(list: UserWatchedEvent[]): { day: string; events: UserWatchedEvent[] }[] {
  const map: Record<string, UserWatchedEvent[]> = {};
  for (const ev of list) {
    const day = getDayLabel(ev.event?.start_time);
    if (!map[day]) map[day] = [];
    map[day].push(ev);
  }
  // Sort within each day by start_time
  for (const day of Object.keys(map)) {
    map[day].sort((a, b) => {
      const ta = a.event?.start_time ? new Date(a.event.start_time).getTime() : 0;
      const tb = b.event?.start_time ? new Date(b.event.start_time).getTime() : 0;
      return ta - tb;
    });
  }
  // Order days: convention order first, then anything else alphabetically
  const known = DAY_ORDER.filter((d) => map[d]);
  const other = Object.keys(map).filter((d) => !DAY_ORDER.includes(d)).sort();
  return [...known, ...other].map((day) => ({ day, events: map[day] }));
}

const WatchedEventList = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'warning' | 'error'>('success');
  const [watchList, setWatchList] = useState<UserWatchedEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());
  // Track which day accordions are open (all open by default)
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSnackbar = (msg: string, severity: 'success' | 'warning' | 'error' = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const toggleDay = (day: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  const fetchWatchedEvents = async () => {
    try {
      const res = await api.get('/user-watched-events/');
      setWatchList(res.data.results);
    } catch (err) {
      console.error('Failed to fetch watched events', err);
    }
  };

  const searchEvents = async (query: string) => {
    try {
      const res = await api.get(`/event-search/?q=${query}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Failed to search events', err);
    }
  };

  const addWatchedEvent = async () => {
    if (!selectedEvent) return;
    try {
      const res = await api.post('/user-watched-events/', {
        gencon_event_id: selectedEvent.game_id,
      });
      setWatchList((prev) => [...prev, res.data]);
      setSelectedEvent(null);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Failed to add watched event', err);
      showSnackbar('Failed to add event to watchlist.', 'error');
    }
  };

  const checkAvailability = async (gameId: string): Promise<void> => {
    setCheckingIds((prev) => new Set(prev).add(gameId));
    try {
      const res = await api.get(`/gencon-event-search/?search=${gameId}`);
      const records = res.data.records || [];
      const match = records.find((record: any) => record._source?.game_code === gameId);
      if (match) {
        const available = match._source.tickets_available > 0;
        const watched = watchList.find((ev) => ev.event?.game_id === gameId);
        if (watched && watched.last_known_status !== available) {
          try {
            await api.patch(`/user-watched-events/${watched.id}/`, { last_known_status: available });
          } catch {
            // non-fatal
          }
        }
        setWatchList((prev) =>
          prev.map((ev) =>
            ev.event?.game_id === gameId ? { ...ev, last_known_status: available } : ev,
          ),
        );
        showSnackbar(
          `${match._source.title} — ${available ? '✅ Available' : '❌ Unavailable'} (${match._source.tickets_available} tickets)`,
          available ? 'success' : 'warning',
        );
      } else {
        showSnackbar('Event not found in Gen Con search.', 'error');
      }
    } catch {
      showSnackbar('Failed to fetch availability.', 'error');
    } finally {
      setCheckingIds((prev) => { const s = new Set(prev); s.delete(gameId); return s; });
    }
  };

  const checkAll = async () => {
    if (checkingAll || watchList.length === 0) return;
    setCheckingAll(true);
    for (const ev of watchList) {
      if (ev.event?.game_id) {
        await checkAvailability(ev.event.game_id);
      }
    }
    setCheckingAll(false);
    showSnackbar(`Checked ${watchList.length} event${watchList.length !== 1 ? 's' : ''}.`, 'success');
  };

  const onDelete = async (gameId: string | undefined) => {
    if (!gameId) return;
    try {
      const watched = watchList.find((ev) => ev.event?.game_id === gameId);
      if (!watched) return;
      await api.delete(`/user-watched-events/${watched.id}/`);
      setWatchList((prev) => prev.filter((ev) => ev.id !== watched.id));
      showSnackbar('Removed from watchlist.', 'success');
    } catch {
      showSnackbar('Failed to remove event.', 'error');
    }
  };

  useEffect(() => { fetchWatchedEvents(); }, []);

  const grouped = groupByDay(watchList);

  return (
    <Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Search + add */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'flex-start' }}>
        <Autocomplete
          sx={{ flexGrow: 1 }}
          options={searchResults}
          getOptionLabel={(option) => `${option.title} (${option.game_id})`}
          filterOptions={(x) => x}
          value={selectedEvent}
          inputValue={searchQuery}
          onInputChange={(_, val, reason) => {
            setSearchQuery(val);
            if (reason === 'clear') {
              setSearchResults([]);
              if (searchDebounce.current) clearTimeout(searchDebounce.current);
              return;
            }
            if (searchDebounce.current) clearTimeout(searchDebounce.current);
            if (val.length >= 3) {
              searchDebounce.current = setTimeout(() => searchEvents(val), 350);
            } else {
              setSearchResults([]);
            }
          }}
          onChange={(_, val) => setSelectedEvent(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search by title or Event ID"
              size="small"
            />
          )}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={addWatchedEvent}
          disabled={!selectedEvent}
          sx={{ whiteSpace: 'nowrap', height: 40 }}
        >
          Add
        </Button>
      </Box>

      {/* Watchlist header + Check All */}
      {watchList.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Watching ({watchList.length})
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PlaylistAddCheckIcon fontSize="small" />}
              onClick={checkAll}
              disabled={checkingAll}
              sx={{ fontSize: '0.72rem' }}
            >
              {checkingAll ? 'Checking…' : 'Check All'}
            </Button>
          </Box>
          <Divider sx={{ mb: 1 }} />
        </>
      )}

      {/* Day accordions */}
      {grouped.map(({ day, events }) => {
        const isOpen = !collapsedDays.has(day);
        const availableCount = events.filter((e) => e.last_known_status).length;
        return (
          <Box key={day} sx={{ mb: 0.5 }}>
            {/* Day header row */}
            <Box
              onClick={() => toggleDay(day)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
                userSelect: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {day}
                </Typography>
                {!isOpen && (
                  <Chip
                    label={`${events.length} event${events.length !== 1 ? 's' : ''}${availableCount > 0 ? ` · ${availableCount} available` : ''}`}
                    size="small"
                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 500 }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isOpen && (
                  <Typography variant="caption" color="text.secondary">
                    {events.length} event{events.length !== 1 ? 's' : ''}
                  </Typography>
                )}
                {isOpen ? <ExpandLessIcon fontSize="small" sx={{ color: 'text.secondary' }} /> : <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
              </Box>
            </Box>

            {/* Collapsible event list */}
            <Collapse in={isOpen}>
              <List disablePadding sx={{ pl: 1 }}>
                {events.map((ev) => {
                  const gameId = ev.event?.game_id;
                  const isChecking = gameId ? checkingIds.has(gameId) : false;
                  const timeLabel = ev.event?.start_time
                    ? new Date(ev.event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : null;
                  return (
                    <ListItem
                      key={ev.id}
                      disablePadding
                      sx={{
                        py: 0.75,
                        '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
                      }}
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Check availability">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => gameId && checkAvailability(gameId)}
                                disabled={isChecking || !gameId}
                                sx={{ color: 'primary.main' }}
                              >
                                <CheckCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(gameId)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500} noWrap sx={{ pr: 8 }}>
                            {ev.event?.title ?? `Event ID: ${gameId}`}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, flexWrap: 'wrap' }}>
                            {timeLabel && (
                              <Typography variant="caption" color="text.secondary">{timeLabel}</Typography>
                            )}
                            <Chip
                              label={ev.last_known_status ? 'Available' : 'Unavailable'}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: ev.last_known_status
                                  ? 'rgba(0,255,129,0.12)'
                                  : 'rgba(239,68,68,0.12)',
                                color: ev.last_known_status ? '#00FF81' : '#f87171',
                                border: 'none',
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </Box>
        );
      })}

      {watchList.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No watched events yet. Search above to add one.
        </Typography>
      )}
    </Box>
  );
};

export default WatchedEventList;
