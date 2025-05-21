import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/api';
import { IconButton } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import styles from './Location.module.css';
import type { Location } from '../../models/locations';
import React from 'react';

const LocationDetail = () => {
  const { id } = useParams();
  const [location, setLocation] = useState<Location | null>(null);

    useEffect(() => {
    api.get<Location>(`/locations/${id}/`)
      .then(res => setLocation(res.data))
      .catch(err => console.error(err));
  }, [id]);
  return (
    <>

    {location && (
      <div>
        <h2>{location.name}</h2>
        <table>
          <thead>
            <tr>
              <th>Room Name</th>
              <th>Floor Level</th>
            </tr>
          </thead>
          <tbody>
            {location.rooms?.map((room, index) => (
              <tr key={index}>
                <td>{room.room_name}</td>
                <td>{room.floor_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
      <IconButton
        component={Link}
        to="/locations"
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

export default LocationDetail;