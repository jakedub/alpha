import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/api';
import { Event } from '../../models/events';
import { IconButton } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import styles from './Event.module.css';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);

  
  useEffect(() => {
    api.get<Event>(`/events/${id}/`)
      .then(res => setEvent(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!event) return <p>Loading...</p>;

  return (
    <>

    <div>
          <h2>{event.title}</h2>
          <p><strong>Description:</strong> {event.long_description}</p>
          {event.game_id && (
          <p>
            <strong>Direct Link:</strong>{' '}
            <a
              href={`https://www.gencon.com/events/${event.game_id.match(/\d+$/)?.[0]}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.gencon.com/events/{event.game_id.match(/\d+$/)?.[0]}
            </a>
          </p>
        )}
          <p>Event ID: {event.game_id}</p>
          {/* Display other key/value fields like your earlier detail view */}
      </div>
      <IconButton
        component={Link}
        to="/events"
        aria-label="Back to events list"
        sx={{
          backgroundColor: '#e0e0e0',
          borderRadius: '50%',
          padding: '8px',
          '&:hover': {
            backgroundColor: '#c0c0c0',
          },
        }}
      >
        <ArrowBack />
      </IconButton>
    </>
  );
};

export default EventDetail;