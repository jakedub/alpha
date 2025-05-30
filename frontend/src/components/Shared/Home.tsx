import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Home = () => {
  return (
    <Container maxWidth={false} sx={{ width: '75vw' }}>
      <Box>
        <Typography variant="h3" gutterBottom>
          Welcome to the Alpha App
        </Typography>
        <Typography variant="body1">
          This is your independent landing page or dashboard.
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;