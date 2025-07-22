//Shown on User Detail/Dashboard
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/api';
import './VendorVisitList.css';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Select,
  MenuItem,
  Grid,
  Button,
} from '@mui/material';

interface VendorVisitListProps {}

type VendorVisit = {
  id: number;
  vendor: {
    name: string;
    booth_number?: string;
  };
  note: string;
  note_type: string;
};

const VendorVisitList: React.FC<VendorVisitListProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendorVisits, setVendorVisits] = useState<VendorVisit[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchVisits = async () => {
      try {
        const response = await api.get('/vendor_visits/');
        setVendorVisits(response.data.results || response.data);  // supports paginated or flat
      } catch (error: any) {
        console.error('Failed to fetch vendor visits:', error);
      }
    };

    fetchVisits();
  }, [user]);

  // Allow editing of note and note_type for each visit
  const handleUpdate = async (id: number, note: string, note_type: string) => {
    try {
      await api.put(`/vendor_visits/${id}/`, { note, note_type });
      // Optionally, you could refresh or show success feedback here
    } catch (error: any) {
      console.error('Failed to update vendor visit:', error);
    }
  };

  const handleChange = (id: number, field: keyof VendorVisit, value: string) => {
    setVendorVisits((prev) =>
      prev.map((visit) =>
        visit.id === id ? { ...visit, [field]: value } : visit
      )
    );
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Your Vendor Visits
      </Typography>
      {vendorVisits.length === 0 ? (
        <Typography>No vendor visits found.</Typography>
      ) : (
        <Grid container spacing={2}>
          {vendorVisits.map((visit) => (
            <Grid item xs={12} sm={6} md={4} key={visit.id}>
              <Card
                variant="outlined"
                onClick={() => setActiveId(visit.id)}
                sx={{
                  backgroundColor: activeId === visit.id ? '#f0f8ff' : 'white',
                  cursor: 'pointer',
                }}
              >
                <CardContent>
                  <Typography variant="h6">{visit.vendor?.name || 'Unknown Vendor'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Booth: {visit.vendor?.booth_number || 'N/A'}
                  </Typography>
                  <Select
                    fullWidth
                    label="Note Type"
                    value={visit.note_type}
                    onChange={(e) => handleChange(visit.id, 'note_type', e.target.value)}
                    sx={{ mt: 2 }}
                  >
                    <MenuItem value="purchase">Purchase</MenuItem>
                    <MenuItem value="demo">Demo</MenuItem>
                  </Select>
                  <TextField
                    fullWidth
                    label="Note"
                    value={visit.note}
                    onChange={(e) => handleChange(visit.id, 'note', e.target.value)}
                    sx={{ mt: 2 }}
                  />
                </CardContent>
                <CardActions>
                  <Button
                    type="button"
                    variant="contained"
                    size="small"
                    onClick={() => handleUpdate(visit.id, visit.note, visit.note_type)}
                  >
                    Save
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
};

export default VendorVisitList;