import { useEffect, useState } from 'react';
import api from '../../api/api';
import type { Vendor } from '../../models/vendors';
import { IconButton, useTheme, Button } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import './VendorDetail.css';
import VendorVisitButton from '../VendorVisit/VendorVisitButton';

function formatTagName(tagName: string) {
  return tagName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const VendorDetail = () => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const vendorId = window.location.pathname.split('/').pop();
    if (vendorId) {
      api.get(`/vendors/${vendorId}/`)
        .then(res => {
          setVendor(res.data);
        })
        .catch(() => setError('Failed to load vendor details.'));
    }
  }, []);

  if (error) return <p>{error}</p>;
  if (!vendor) return <p>Loading...</p>;

  return (
    <div>
      <Button
        component={Link}
        to="/vendors"
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        sx={{ marginBottom: 2, position: 'fixed', top: 16, left: 100, zIndex: 1300 }}
      >
        Return to Vendor List
      </Button>
      <h2>{vendor.name}</h2>
      <h3>Vendor Details</h3>
      <p>GenCon ID: {vendor.gencon_id}</p>
      <p>General ID: {vendor.id}</p>
      <p>Booth Number(s): {vendor.booth_number || 'N/A'}</p>
      <p>Website: {vendor.websiteUrl ? <a href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer">{vendor.websiteUrl}</a> : 'N/A'}</p>
      <p>Description: {vendor.description || 'No description available.'}</p>
      <p>Tags: {vendor.tags?.map(tag => formatTagName(tag.name)).join(', ') || 'None'}</p>
      <VendorVisitButton vendor={vendor}/>
      {/* TODO: Replace 'event={yourEventObject}' with the actual CalendarEvent object */}
      
      {vendor.mapUrl && (
        <div>
          <img src={vendor.mapUrl} alt={`${vendor.name} map location`} className="vendor-map-image" />
          <img src={vendor.mapUrl} alt={`${vendor.name} map location`} className="vendor-map-image-fullwidth" />
          {vendor.mapX && vendor.mapY && (
            <p>Coordinates: ({vendor.mapX}, {vendor.mapY})</p>
          )}
        </div>
      )}
    </div>
  );
}

export default VendorDetail;