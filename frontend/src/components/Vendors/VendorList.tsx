import { useEffect, useState, useRef } from 'react';
import api from '../../api/api';
import type { Vendor } from '../../models/vendors';
import { IconButton, useTheme, Card, Grid, Typography, Box, Fab } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link } from 'react-router-dom';
import VendorFilter from './VendorFilter';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

const VendorList = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]); // tag filters
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const theme = useTheme();

  const topRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchAllVendors = async () => {
      try {
        let allVendors: Vendor[] = [];
        let url = '/vendors/';
        while (url) {
          const res = await api.get(url);
          allVendors = [...allVendors, ...res.data.results];
          url = res.data.next;
        }
        setVendors(allVendors);
      } catch {
        setError('Failed to load vendors.');
      }
    };

    fetchAllVendors();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nearTop = scrollPosition < 100;

  // Filtering logic
  const filteredVendors = vendors.filter((vendor) => {
    const matchesTags =
      filters.length === 0 ||
      (filters.includes("no_tag") && (!vendor.tags || vendor.tags.length === 0)) ||
      vendor.tags?.some(tag => filters.includes(tag.name));
    const matchesSelectedVendors =
      selectedVendors.length === 0 || selectedVendors.some(sel => sel.gencon_id === vendor.gencon_id);
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTags && matchesSelectedVendors && matchesSearch;
  });

  return (
    <>
      <div ref={topRef} />
      <Box sx={{ padding: 2, backgroundColor: theme.palette.background.default }}>
        <Typography variant="h4" gutterBottom>
          Vendors
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Browse through the list of vendors available at the event. Total Vendors: {filteredVendors.length}
        </Typography>
        <Box display="flex" flexDirection="row" maxWidth={1200} margin="0 auto" width="100%">
          <Box flexGrow={1}>
            <div className="filtered-results">
              <Box
                sx={{
                  position: 'relative',
                  height: 'calc(100vh - 100px)',
                  overflowY: 'auto',
                  width: '100%',
                  paddingTop: '20px',
                  padding: 2,
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                }}
              >
                {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
                <Box sx={{ marginTop: 2 }}>
                  <Grid container spacing={2} justifyContent="center" maxWidth="lg">
                    {filteredVendors.map((vendor) => (
                      <Grid item xs={12} sm={6} md={4} lg={4} key={vendor.gencon_id}>
                        <Card sx={{ padding: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1">{vendor.name}</Typography>
                          <IconButton
                            component={Link}
                            to={`/vendors/${vendor.gencon_id}`}
                            aria-label="View vendor details"
                            sx={{
                              backgroundColor: theme.palette.background.paper,
                              borderRadius: '50%',
                              color: theme.palette.text.disabled,
                              padding: '8px',
                              '&:hover': { backgroundColor: '#c0c0c0' },
                            }}
                          >
                            <OpenInNewIcon />
                          </IconButton>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </div>
          </Box>
          <Box
            sx={{
              position: 'sticky',
              top: 10,
              height: '50vh',
              backgroundColor: theme.palette.background.paper,
              zIndex: theme.zIndex.appBar + 1,
              padding: 2,
              boxSizing: 'border-box',
              marginTop: '75px',
              borderLeft: `1px solid ${theme.palette.divider}`,
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
              tags={vendors.flatMap(v => v.tags ?? []).map(tag => tag.name)}
            />
          </Box>
        </Box>

        {/* Scroll buttons */}
        {nearTop ? (
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
        <div ref={scrollRef} />
      </Box>
    </>
  );
};

export default VendorList;