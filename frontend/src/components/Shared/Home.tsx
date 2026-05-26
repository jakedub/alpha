import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
  useTheme,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MapIcon from '@mui/icons-material/Map';
import SyncIcon from '@mui/icons-material/Sync';
import CasinoIcon from '@mui/icons-material/Casino';
import DataSync from './DataSync';

// Gen Con 2025: Aug 7–10 (adjust year as needed)
const GENCON_DATE = new Date('2025-08-07T00:00:00');

function getDaysUntil(target: Date): number {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const QUICK_LINKS = [
  {
    label: 'Events',
    description: 'Search and add Gen Con events to your schedule.',
    path: '/events',
    icon: <EventIcon sx={{ fontSize: 32 }} />,
    color: '#00d4ff',
  },
  {
    label: 'Schedule',
    description: 'View your calendar and your group\'s full schedule.',
    path: '/fullcalendar2',
    icon: <CalendarMonthIcon sx={{ fontSize: 32 }} />,
    color: '#f59e0b',
  },
  {
    label: 'Vendors',
    description: 'Browse exhibitors and plan your shopping route.',
    path: '/vendors',
    icon: <StorefrontIcon sx={{ fontSize: 32 }} />,
    color: '#a855f7',
  },
  {
    label: 'Map',
    description: 'Navigate venues and get travel-time warnings.',
    path: '/map',
    icon: <MapIcon sx={{ fontSize: 32 }} />,
    color: '#00FF81',
  },
];

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const daysUntil = getDaysUntil(GENCON_DATE);

  const handleTriggerSync = async () => {
    if (isRunning) return;
    try {
      setIsRunning(true);
      const api = (await import('../../api/api')).default;
      const res = await api.post('/data-sync/trigger/');
      setTaskId(res.data.task_id);
    } catch (err) {
      console.error('Failed to trigger sync', err);
      setIsRunning(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', px: 2, py: 4 }}>

      {/* Hero */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <CasinoIcon sx={{ color: 'primary.main', fontSize: 36 }} />
          <Typography variant="h3" fontWeight={700}>
            Alpha
          </Typography>
        </Box>
        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ mb: 2 }}>
          Your personal Gen Con convention planner.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={daysUntil === 0 ? "It's Gen Con!" : `${daysUntil} days until Gen Con`}
            color="primary"
            sx={{ fontWeight: 600, fontSize: '0.85rem' }}
          />
          <Typography variant="caption" color="text.secondary">
            Aug 7–10, 2025 · Indianapolis, IN
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Quick-access cards */}
      <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.1em', mb: 2, display: 'block' }}>
        Get Started
      </Typography>
      <Grid container spacing={2} sx={{ mb: 5 }}>
        {QUICK_LINKS.map((link) => (
          <Grid item xs={12} sm={6} md={3} key={link.label}>
            <Card
              sx={{
                height: '100%',
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:hover': {
                  boxShadow: `0 0 0 1px ${link.color}`,
                  borderColor: link.color,
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(link.path)}
                sx={{ height: '100%', p: 0.5 }}
              >
                <CardContent>
                  <Box sx={{ color: link.color, mb: 1.5 }}>{link.icon}</Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {link.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {link.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* Data sync utility */}
      <Box>
        <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.1em', mb: 1.5, display: 'block' }}>
          Data
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={handleTriggerSync}
            disabled={isRunning}
          >
            {isRunning ? 'Sync running…' : 'Run data sync'}
          </Button>
          <Typography variant="caption" color="text.secondary">
            Pulls the latest events, vendors, and schedules from Gen Con.
          </Typography>
        </Box>
        {taskId && (
          <Box sx={{ mt: 2 }}>
            <DataSync taskId={taskId} onComplete={() => setIsRunning(false)} />
          </Box>
        )}
      </Box>

    </Box>
  );
};

export default Home;
