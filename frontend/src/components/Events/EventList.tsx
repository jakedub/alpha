import { useEffect, useState, useRef } from 'react';
import api from '../../api/api';
import { Event } from '../../models/events';
import styles from './Event.module.css';
import { formatKey } from '../../utils/formatKey';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
  useTheme,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import React from 'react';

import Collapse from '@mui/material/Collapse';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Fab from '@mui/material/Fab';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

import EventFilter from './EventFilter';

function Row({ row }: { row: Event }) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const start = new Date(row.start_time);
  const end = new Date(row.end_time);
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  const [filters, setFilters] = useState({
    event_type: '',
    gameSystem: '',
    day: '',
    startTime: '',
    group: '',
    location: '',
    ageRequirements: [] as string[],
    experienceLevels: [] as string[],
  });

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.event_type}</TableCell>
        <TableCell>{row.title}
          <IconButton component={Link}
              to={`/events/${row.game_id}`}
              aria-label="View event details"
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: '50%',
                color: theme.palette.text.disabled,
                padding: '8px',
                '&:hover': {
                  backgroundColor: '#c0c0c0',
                },
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
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="subtitle1" gutterBottom component="div">
                Description
              </Typography>
              <Typography>{row.short_description}</Typography>
              <Typography sx={{ marginTop: 1 }}><strong>Location:</strong> {row.location.name}</Typography>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function CollapsibleTable({ events }: { events: Event[] }) {
  return (
    <TableContainer component={Paper} sx={{ marginBottom: 4 }}>
      <Table aria-label="event table">
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
            <Row key={event.game_id} row={event} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const [scrollPosition, setScrollPosition] = useState(0);
const [loadingMore, setLoadingMore] = useState(false);

useEffect(() => {
  api.get(`/events/?page=${page}`)
    .then(res => {
      const newEvents = Array.isArray(res.data?.results)
        ? res.data.results
        : Array.isArray(res.data)
        ? res.data
        : [];
      setEvents(prev => [...prev, ...newEvents]);
      setHasMore(!!res.data?.next);
      if (loadingMore) {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    })
    .catch(() => setError('Failed to load event list.'));
}, [page]);

  // Refs for scrolling
  const topRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleScrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    setLoadingMore(false);
  };
  const handleScrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
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
          <EventFilter events={events} />
          <CollapsibleTable events={events} />
          <Box textAlign="center" marginBottom={2}>
          </Box>
          <div ref={scrollRef} />
          {hasMore && (
            <Box textAlign="center" marginTop={2}>
              <Button
                onClick={() => {
                  setPage(prev => prev + 1);
                  setLoadingMore(true);
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
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
            onClick={handleScrollToBottom}
            sx={{ position: 'fixed', top: 80, right: 16, zIndex: 1200 }}
          >
            <ArrowDownwardIcon />
          </Fab>
        ) : (
          <Fab
            color="secondary"
            aria-label="scroll up"
            onClick={handleScrollToTop}
            sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1200 }}
          >
            <ArrowUpwardIcon />
          </Fab>
        )}
      </div>
    </div>
  );
};

export default EventList;