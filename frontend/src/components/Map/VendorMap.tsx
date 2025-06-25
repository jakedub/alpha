

import React from 'react';
import { Box, Typography } from '@mui/material';
import './VendorMap.css';

const vendors = [
  { id: 1, name: 'Vendor One', x: 100, y: 150, url: 'https://example.com/vendor1' },
  { id: 2, name: 'Vendor Two', x: 250, y: 200, url: 'https://example.com/vendor2' },
];

export default function VendorMap() {
  return (
    <>
      <Box sx={{ display: 'flex', height: '100vh', position: 'relative', flex: 1 }}>
        <img
          src="/path/to/your/map.png"
          alt="Vendor Map"
          className="vendor-map-image"
        />
        {vendors.map((vendor) => (
          <a
            key={vendor.id}
            href={vendor.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'absolute',
              top: vendor.y,
              left: vendor.x,
              transform: 'translate(-50%, -50%)',
              background: 'white',
              padding: '2px 4px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '0.75rem',
              color: '#1976d2',
              border: '1px solid #ccc',
            }}
          >
            {vendor.id}. {vendor.name}
          </a>
        ))}
      </Box>
      <Box sx={{ width: 300, padding: 2, backgroundColor: '#f9f9f9', borderLeft: '1px solid #ddd' }}>
        <Typography variant="h6" gutterBottom>User Agenda</Typography>
        <Typography variant="body2" color="textSecondary">
          Select vendors to add to your schedule.
        </Typography>
        {/* Agenda items will go here */}
      </Box>
    </>
  );
}