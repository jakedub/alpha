
import RoomList from './components/RoomList';
import './App.css';
import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Button } from '@mui/material';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [count, setCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#5f6c7b' },
      secondary: { main: '#90b4ce' },
      text: {
        primary: '#094067',
        secondary: '#5f6c7b',
      },
      background: {
        default: darkMode ? '#121212' : '#d8eefe', // strong visual difference
        paper: '#fffffe',
      },
      error: { main: '#ef4565' },
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#fffffe',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* << Apply global background + text color */}
      <div id="dark-button">
        <h1>{darkMode ? 'Dark Mode' : 'Light Mode'}</h1>
        <ThemeToggle onThemeChange={setDarkMode} />
      </div>

      <div>
        <h1>Vite + React</h1>
        <Button variant="contained" color="primary" onClick={() => setCount(count + 1)}>
          Click Me (Count: {count})
        </Button>
        <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
      </div>
        <div>
      <h1>Event Management App</h1>
      <RoomList />
    </div>
    </ThemeProvider>
  );
}

export default App;