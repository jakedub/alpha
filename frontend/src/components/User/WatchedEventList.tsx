import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
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
import { UserWatchedEvent } from '../../models/user_watched_event';
import api from '../../api/api';

type Event = {
  id: number;
  title: string;
  game_id: string;
};

const WatchedEventList = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'warning' | 'error'>('success');
  const [watchList, setWatchList] = useState<UserWatchedEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [checkingAll, setCheckingAll] = useState(false);

  // Track which items are currently being checked
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

  const showSnackbar = (msg: string, severity: 'success' | 'warning' | 'error' = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
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
      // Clear the search state
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
            if (reason === 'clear') { setSearchResults([]); }
          }}
          onChange={(_, val) => setSelectedEvent(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search events"
              size="small"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchQuery.length >= 3) searchEvents(searchQuery);
                }
              }}
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

      {/* Watchlist */}
      <List disablePadding>
        {watchList.map((ev) => {
          const gameId = ev.event?.game_id;
          const isChecking = gameId ? checkingIds.has(gameId) : false;
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
                  <Chip
                    label={ev.last_known_status ? 'Available' : 'Unavailable'}
                    size="small"
                    sx={{
                      mt: 0.25,
                      height: 18,
                      fontSize: '0.65rem',
                      bgcolor: ev.last_known_status
                        ? 'rgba(0,255,129,0.12)'
                        : 'rgba(239,68,68,0.12)',
                      color: ev.last_known_status ? '#00FF81' : '#f87171',
                      border: 'none',
                    }}
                  />
                }
              />
            </ListItem>
          );
        })}
      </List>

      {watchList.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No watched events yet. Search above to add one.
        </Typography>
      )}
    </Box>
  );
};

export default WatchedEventList;
