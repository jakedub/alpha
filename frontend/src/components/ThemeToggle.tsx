import { useState, useEffect } from 'react';
import { Button } from '@mui/material';

export default function ThemeToggle({ onThemeChange }: { onThemeChange: (darkMode: boolean) => void }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    onThemeChange(dark);
  }, [dark, onThemeChange]);

  return (
    <Button
      variant="contained"
      color={dark ? 'secondary' : 'primary'}
      onClick={() => setDark(prev => !prev)}
      sx={{
        padding: '8px 16px',
        borderRadius: '8px',
      }}
    >
      Toggle Theme
    </Button>
  );
}