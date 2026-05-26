import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import type { Vendor } from '../../models/vendors';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VendorFilter from './VendorFilter';

const VendorList = () => {
  const theme = useTheme();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        let all: Vendor[] = [];
        let url = '/vendors/';
        while (url) {
          const res = await api.get(url);
          all = [...all, ...res.data.results];
          url = res.data.next;
        }
        setVendors(all);
      } catch {
        setError('Failed to load vendors.');
      }
    };
    fetchAll();
  }, []);

  const filteredVendors = vendors.filter((vendor) => {
    const matchesTags =
      filters.length === 0 ||
      (filters.includes('no_tag') && (!vendor.tags || vendor.tags.length === 0)) ||
      vendor.tags?.some((tag) => filters.includes(tag.name));
    const matchesSelected =
      selectedVendors.length === 0 ||
      selectedVendors.some((sel) => sel.gencon_id === vendor.gencon_id);
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTags && matchesSelected && matchesSearch;
  });

  return (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

      {/* Filter sidebar */}
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          p: 2,
          position: 'sticky',
          top: 80,
          maxHeight: 'calc(100vh - 96px)',
          overflowY: 'auto',
        }}
      >
        <VendorFilter
          vendors={vendors}
          selectedTags={filters}
          onTagChange={setFilters}
          selectedVendors={selectedVendors}
          setSelectedVendors={setSelectedVendors}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          tags={vendors.flatMap((v) => v.tags ?? []).map((tag) => tag.name)}
        />
      </Box>

      {/* Results */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>Vendors</Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredVendors.length} of {vendors.length}
          </Typography>
        </Box>

        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

        {/* Card grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2,
          }}
        >
          {filteredVendors.map((vendor) => (
            <Card
              key={vendor.gencon_id}
              sx={{
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:hover': {
                  boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <CardActionArea component={Link} to={`/vendors/${vendor.gencon_id}`}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <StorefrontIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {vendor.name}
                      </Typography>
                    </Box>
                    <ArrowForwardIosIcon sx={{ fontSize: 12, color: 'text.secondary', flexShrink: 0, mt: 0.3 }} />
                  </Box>

                  {vendor.booth_number && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Booth {vendor.booth_number}
                    </Typography>
                  )}

                  {vendor.tags && vendor.tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {vendor.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag.name}
                          label={tag.name.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      ))}
                      {vendor.tags.length > 3 && (
                        <Chip
                          label={`+${vendor.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default VendorList;
