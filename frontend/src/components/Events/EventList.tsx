import React from 'react';
import qs from 'qs';
import { useEffect, useState, useRef } from 'react';
import api from '../../api/api';
import { Event } from '../../models/events';
import styles from './Event.module.css';
import { formatKey } from '../../utils/formatKey';
import { Link } from 'react-router-dom';
import {
  Typography,
  Box,
  IconButton,
  useTheme,
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fab
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import EventFilter from './EventFilter';
import { Filters } from '../../types/filters';

function Row({ row, onAddToCalendar }: { row: Event; onAddToCalendar?: (eventId: number) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [row.game_id]);

  const start = new Date(row.start_time);
  const end = new Date(row.end_time);
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

  const handleAddToSchedule = async (eventId: string) => {
    try {
      const res = await api.get('/me/');
      const isLoggedIn = res.status === 200;

      if (!isLoggedIn) {
        alert('You must be logged in to add this event to your schedule.');
        return;
      }

      await api.post('/user_events/', {
        event: eventId,
        status: 'wishlist',
      });

      alert('Event added to your schedule!');

      if (onAddToCalendar) {
        onAddToCalendar(Number(eventId));
      }
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        alert('You must be logged in to add this event to your schedule.');
      } else {
        console.error('Error adding event:', err);
        alert('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.event_type}</TableCell>
        <TableCell>
          {row.title}
          <IconButton
            component={Link}
            to={`/events/${row.game_id}`}
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: '50%',
              color: theme.palette.text.disabled,
              padding: '8px',
              '&:hover': { backgroundColor: '#c0c0c0' }
            }}
          >
            <OpenInNewIcon />
          </IconButton>
        </TableCell>
        <TableCell>{start.toLocaleString()}</TableCell>
        <TableCell>{durationMinutes.toFixed(0)} min</TableCell>
        <TableCell>${row.cost}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} style={{ paddingBottom: 0, paddingTop: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="subtitle1" gutterBottom>Description</Typography>
              <Typography>{row.short_description}</Typography>
              <Typography sx={{ marginTop: 1 }}>
                <strong>Location:</strong> {row.location.name}
              </Typography>
              <Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (!row.game_id) {
                      alert('Missing event ID. Please try another event.');
                      return;
                    }
                    handleAddToSchedule(row.game_id);
                  }}
                >
                  Add to Schedule
                </Button>
              </Typography>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
function CollapsibleTable({
  events,
  onAddToCalendar,
}: {
  events: Event[];
  onAddToCalendar?: (eventId: number) => void;
}) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ padding: 2 }}>
        Showing {events.length} events
      </Typography>
      <TableContainer component={Paper} sx={{ marginBottom: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <Row key={`${event.game_id}-${event.start_time}`} row={event} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

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
  const [scrollPosition, setScrollPosition] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const topRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  const params: Record<string, string | string[] | number> = { page: 1 };

  if (filters.eventTypes.length) params.event_type = filters.eventTypes;
  if (filters.gameSystems.length) params.game_system = filters.gameSystems;
  if (filters.days.length) params.day = filters.days;
  if (filters.groups.length) params.gaming_group = filters.groups;
  if (filters.locations.length) params.location = filters.locations
  if (filters.startTimes.length) params.start_time = filters.startTimes;
  if (filters.ageRequirements.length) params.minimum_age = filters.ageRequirements;
  if (filters.experienceLevels.length) params.experience_required = filters.experienceLevels;


  api
    .get('/events/', {
      params,
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat: 'repeat' }), // key change here
    })
    .then((res) => {
      const newEvents = Array.isArray(res.data?.results)
        ? res.data.results
        : Array.isArray(res.data)
        ? res.data
        : [];
      setEvents(newEvents);
      setHasMore(!!res.data?.next);
      setTotalCount(res.data?.count || 0);
      setPage(1);
      if (loadingMore) scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    })
    .catch(() => setError('Failed to load event list.'));
}, [filters]);
  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nearTop = scrollPosition < 100;

  return (
    <div>
      <div ref={topRef} />
      <h2>Events</h2>
      <div>
        {error && <p>{error}</p>}
        <Box>
          <EventFilter events={events} filters={filters} onFilterChange={setFilters} />
          <Box sx={{ marginTop: 2 }}>
            <Typography variant="body2">Total Events: {totalCount}</Typography>
          </Box>
          <CollapsibleTable key={events.map(e => e.game_id).join(',')} events={events} />
          <div ref={scrollRef} />
          {hasMore && (
            <Box textAlign="center" mt={2}>
              <Button
                onClick={() => {
                  setPage((prev) => prev + 1);
                  setLoadingMore(true);
                }}
                sx={{ padding: '10px 20px', fontSize: '16px' }}
                variant="contained"
              >
                Load More
              </Button>
            </Box>
          )}
        </Box>
        {loadingMore || nearTop ? (
          <Fab
            color="primary"
            aria-label="scroll down"
            onClick={() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' })}
            sx={{ position: 'fixed', top: 80, right: 16, zIndex: 1200 }}
          >
            <ArrowDownwardIcon />
          </Fab>
        ) : (
          <Fab
            color="secondary"
            aria-label="scroll up"
            onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
            sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1200 }}
          >
            <ArrowUpwardIcon />
          </Fab>
        )}
      </div>
    </div>
  );
};

export const EventTable = ({
  events,
  onAddToCalendar,
}: {
  events: Event[];
  onAddToCalendar?: (eventId: number) => void;
}) => {
  return <EventList events={events} onAddToCalendar={onAddToCalendar} />;
};
export default EventList;