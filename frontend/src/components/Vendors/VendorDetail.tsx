import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import type { Vendor } from '../../models/vendors';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlaceIcon from '@mui/icons-material/Place';
import VendorVisitButton from '../VendorVisit/VendorVisitButton';

function formatTagName(tagName: string) {
  return tagName.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const VendorDetail = () => {
  const theme = useTheme();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const vendorId = window.location.pathname.split('/').pop();
    if (vendorId) {
      api.get(`/vendors/${vendorId}/`)
        .then((res) => setVendor(res.data))
        .catch(() => setError('Failed to load vendor details.'));
    }
  }, []);

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
        <Button component={Link} to="/vendors" startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Vendors
        </Button>
      </Box>
    );
  }

  if (!vendor) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', px: 2, py: 3 }}>

      {/* Back nav */}
      <Button
        component={Link}
        to="/vendors"
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3, color: 'text.secondary', pl: 0 }}
      >
        All Vendors
      </Button>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StorefrontIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>{vendor.name}</Typography>
            {vendor.booth_number && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                <PlaceIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Booth {vendor.booth_number}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <VendorVisitButton vendor={vendor} />
      </Box>

      {/* Tags */}
      {vendor.tags && vendor.tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {vendor.tags.map((tag) => (
            <Chip
              key={tag.name}
              label={formatTagName(tag.name)}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Info card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
            About
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, color: vendor.description ? 'text.primary' : 'text.secondary' }}>
            {vendor.description || 'No description available.'}
          </Typography>

          {vendor.website_url && (
            <Button
              variant="outlined"
              size="small"
              endIcon={<OpenInNewIcon fontSize="small" />}
              component="a"
              href={vendor.website_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit website
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Map section */}
      {vendor.map_url && (
        <Card>
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
              Floor Map
            </Typography>
            {vendor.map_x && vendor.map_y && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                Coordinates: ({vendor.map_x}, {vendor.map_y})
              </Typography>
            )}
          </CardContent>
          <CardMedia
            component="img"
            image={vendor.map_url}
            alt={`${vendor.name} map location`}
            sx={{
              maxHeight: 480,
              objectFit: 'contain',
              bgcolor: theme.palette.mode === 'dark' ? '#1f2937' : '#f8fafc',
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          />
        </Card>
      )}
    </Box>
  );
};

export default VendorDetail;
