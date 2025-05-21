import { useEffect, useState } from 'react';
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

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

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
    })
    .catch(() => setError('Failed to load event list.'));
}, [page]);

  return (
    <div>
      <h2>Events</h2>
      <div>
        {error && <p>{error}</p>}
        <Box>
        <p>

            {Array.isArray(events) && events.map((event, index) => {
              return (
                <Box
                  key={event.game_id}
                  sx={{
                    backgroundColor: '#fff',
                    marginBottom: '16px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    text: theme.palette.text.secondary,
                  }}
                >
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}
                        variant="h6">{event.title}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography
                        sx={{
                          color: theme.palette.text.secondary,
                          fontWeight: 'bold',
                          textAlign: 'left',
                        }}
                      >
                        <strong>Type:</strong> {event.event_type}
                      </Typography>
                      <Typography
                        sx={{
                          color: theme.palette.text.secondary,
                          fontWeight: 'bold',
                          textAlign: 'left',
                        }}
                      >
                        <strong>Start:</strong> {new Date(event.start_time).toLocaleString()}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          sx={{
                            color: theme.palette.text.secondary,
                            fontWeight: 'bold',
                            textAlign: 'left',
                          }}
                        >
                          <strong>Cost:</strong> ${event.cost}
                        </Typography>
                        <IconButton
                          component={Link}
                          to={`/events/${event.game_id}`}
                          aria-label="View event details"
                          sx={{
                            backgroundColor: '#e0e0e0',
                            borderRadius: '50%',
                            color: theme.palette.text.secondary,
                            padding: '8px',
                            '&:hover': {
                              backgroundColor: '#c0c0c0',
                            },
                          }}
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              );
            })}
            {hasMore && (
              <Box textAlign="center" marginTop={2}>
                <Button
                  onClick={() => setPage(prev => prev + 1)}
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
        </p>
        </Box>
      </div>
    </div>
  );
};

export default EventList;