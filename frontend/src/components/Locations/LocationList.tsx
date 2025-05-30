// frontend/src/components/LocationList.tsx
import { useEffect, useState } from 'react';
import api from '../../api/api';
import type { Location } from '../../models/locations';
import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import styles from './Location.module.css';

const LocationList = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

    useEffect(() => {
    api.get('/locations/')
        .then(res => {
        setLocations(res.data.results); // <-- FIX: assign results array, not the full object
        })
        .catch(() => setError('Failed to load locations.'));
    }, []);

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Locations</h2>
      <div className={styles.locationOuter}>
        {locations.map((location) => (
          <RouterLink
            key={location.id}
            to={`/locations/${location.id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              width: '250px',
              boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
              transition: 'box-shadow 0.2s ease',
              background: 'white',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 10px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '2px 2px 6px rgba(0,0,0,0.1)';
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>{location.name}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.9em', color: '#666' }}>
                Address: {location.address || 'N/A'}
              </p>
            </div>
          </RouterLink>
        ))}
      </div>
    </div>
  );
};

// Error Boundary wrapper component
class LocationListErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }


  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong loading the locations.</h2>;
    }
    return this.props.children;
  }
}

export const LocationListWithBoundary = () => (
  <LocationListErrorBoundary>
    <LocationList />
  </LocationListErrorBoundary>
);

export default LocationListWithBoundary;