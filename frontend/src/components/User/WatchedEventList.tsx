import React, { useEffect, useState } from 'react';
import { TextField, Button, List, ListItem, ListItemText, Typography, Autocomplete, Snackbar, Alert } from '@mui/material';
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
  const [debounceTimeout, setDebounceTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

const fetchWatchedEvents = async () => {
  try {
    const res = await api.get('/user-watched-events/');
    setWatchList(res.data.results); // <-- use .results here
  } catch (err) {
    console.error("Failed to fetch watched events", err);
  }
};

  const searchEvents = async (query: string) => {
    try {
      const res = await api.get(`/event-search/?q=${query}`);
      setSearchResults(res.data);
      console.log("Search results:", res.data);
    } catch (err) {
      console.error("Failed to search events", err);
    }
  };

  const addWatchedEvent = async () => {
    if (!selectedEvent) return;
    try {
      const res = await api.post('/user-watched-events/', {
        gencon_event_id: selectedEvent.game_id
      });
      setWatchList((prev) => [...prev, res.data]);
      setSelectedEvent(null);
    } catch (err) {
      console.error("Failed to add watched event", err);
    }
  };
  const checkAvailability = async (gameId: string) => {
    try {
      const res = await api.get(`/gencon-event-search/?search=${gameId}`);
      console.log("Search results:", res.data);

      const records = res.data.records || [];
      const match = records.find((record: any) => record._source?.game_code === gameId);

      if (match) {
        const available = match._source.tickets_available > 0;
        setSnackbarMessage(`${match._source.title} is ${available ? '✅ Available' : '❌ Unavailable'} (${match._source.tickets_available} tickets)`);
        setSnackbarSeverity(available ? 'success' : 'warning');
      } else {
        setSnackbarMessage("Event not found in Gen Con search.");
        setSnackbarSeverity('error');
      }
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Search failed", err);
      setSnackbarMessage("Failed to fetch event availability.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  useEffect(() => {
    fetchWatchedEvents();
  }, []);

  async function onDelete(game_id: string | undefined): Promise<void> {
    if (!game_id) return;
    try {
      // Find the watched event to delete by matching game_id
      const watchedEvent = watchList.find(ev => ev.event?.game_id === game_id);
      if (!watchedEvent) return;
      await api.delete(`/user-watched-events/${watchedEvent.id}/`);
      setWatchList(prev => prev.filter(ev => ev.id !== watchedEvent.id));
      setSnackbarMessage("Event removed from watchlist.");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Failed to remove watched event", err);
      setSnackbarMessage("Failed to remove event.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }
  return (
    <>
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

      <Autocomplete
        options={searchResults}
        getOptionLabel={(option) => `${option.title} (${option.game_id})`}
        filterOptions={(x) => x} // Disable client-side filtering
        onInputChange={(_, newInputValue) => {
          setSearchQuery(newInputValue);
        }}
        onChange={(_, newValue) => setSelectedEvent(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search Events"
            fullWidth
            sx={{ mb: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); // prevent form submission or Autocomplete default
                if (searchQuery.length >= 3) {
                  searchEvents(searchQuery);
                }
              }
            }}
          />
        )}
      />
      <Button
        variant="outlined"
        onClick={addWatchedEvent}
        disabled={!selectedEvent}
      >
        Add to Watchlist
      </Button>
      <List>
        {watchList.map((ev) => (
          <ListItem
            key={ev.id}
            secondaryAction={
              <>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (ev.event?.game_id) {
                      checkAvailability(ev.event.game_id);
                    }
                  }}
                  sx={{ mr: 1 }}
                >
                  Check
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onDelete(ev.event?.game_id)}
                  color="error"
                >
                  Remove
                </Button>
              </>
            }
          >
            <ListItemText
              primary={ev.event?.title ?? `Event ID: ${ev.event?.game_id}`}
              secondary={ev.last_known_status ? '✅ Available' : '❌ Unavailable'}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default WatchedEventList;