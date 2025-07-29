// src/components/DevConsoleButton.tsx
import React from 'react';
import { openConsoleWindow } from '../../utils/devConsole';
import Button from '@mui/material/Button';

const DevConsoleButton: React.FC = () => {
  const handleClick = () => {
    openConsoleWindow();
  };

  return (
    <Button
      variant="contained"
      color="secondary"
      onClick={handleClick}
      sx={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 1000,
        borderRadius: '8px',
        opacity: 0.85,
        textTransform: 'none',
        fontWeight: 500,
      }}
    >
      Open Dev Console
    </Button>
  );
};

export default DevConsoleButton;