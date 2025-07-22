//Button shown on Vendor Detail to assign to user
import { useNavigate } from 'react-router-dom';
import { Button, Alert, Snackbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';
import { CalendarEvent } from '../../models/calendar_event';
import { Vendor } from '../../models/vendors';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/api';


interface VendorVisitButtonProps {
  vendor: Vendor;
}

const VendorVisitButton: React.FC<VendorVisitButtonProps> = ({ vendor }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

const handleClick = async () => {
  if (!user) {
    alert('Please log in to add this vendor to your visit list.');
    navigate('/login');
    return;
  }

  const payload = {
    vendor_id: vendor.id,
    note: '',
    note_type: 'demo',
  };

  console.log('Sending VendorVisit payload:', JSON.stringify(payload));

  try {
    const response = await api.post('/vendor_visits/', payload);

    setOpen(true);
    setTimeout(() => {
      setOpen(false);
      navigate('/vendors');
    }, 2000);
  } catch (error: any) {
    console.error('VendorVisit creation failed:', {
      error,
      user,
      vendor: vendor.gencon_id,
    });

    alert('Error assigning vendor visit.');
  }
};
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleClick}
        sx={{ marginTop: 2, backgroundColor: theme.palette.primary.main }}
      >
        Visit Vendor
      </Button>
      <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)}>
        <Alert onClose={() => setOpen(false)} severity="success" sx={{ width: '100%' }}>
          Vendor visit assigned!
        </Alert>
      </Snackbar>
    </>
  );
};

export default VendorVisitButton;