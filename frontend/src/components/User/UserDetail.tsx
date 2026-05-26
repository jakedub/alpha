import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Calendar } from './Calendar';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/api';
import type { UserEvent } from '../../models/user_event';
import type { CalendarEvent as CalendarEventRaw } from '../../models/calendar_event';
import type { RelatedUser } from '../../models/related_user';
import { ColorOptions, RelationshipOptions } from '../../models/enum';
import VendorVisitList from '../VendorVisit/VendorVisitList';
import WatchedEventList from './WatchedEventList';
import { User } from '../../models/user';

interface CalendarEventDisplay {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  category?: string;
  color?: string;
  location?: string;
  gameId?: string;
}

// Map old neon DB colors → new dark-mode palette
const LEGACY_COLOR_MAP: Record<string, string> = {
  '#00F0FF': '#38bdf8',
  '#00FF81': '#34d399',
  '#FFA900': '#f59e0b',
  '#FF6800': '#fb923c',
  '#6F2DBD': '#a78bfa',
};
function resolveColor(c: string): string {
  return LEGACY_COLOR_MAP[c.toUpperCase()] ?? LEGACY_COLOR_MAP[c] ?? c;
}

// Event-type → calendar color
const EVENT_TYPE_COLORS: Record<string, string> = {
  vendor_visit: '#0f766e', // teal-700 — muted, dark-mode safe
  custom:       '#a78bfa', // violet, matches palette
};
const DEFAULT_EVENT_COLOR = '#1976d2';

function mapCalendarEventRawToDisplay(ce: CalendarEventRaw): CalendarEventDisplay {
  const color = EVENT_TYPE_COLORS[ce.event_type] ?? DEFAULT_EVENT_COLOR;
  const vendor = ce.vendor_visit?.vendor;
  const location = vendor
    ? `${vendor.name}${vendor.booth_number ? ` — Booth ${vendor.booth_number}` : ''}`
    : undefined;
  return {
    title: ce.title_override ?? ce.title ?? 'Untitled Event',
    start: new Date(ce.effective_start_time ?? ce.start_time),
    end: new Date(ce.effective_end_time ?? ce.end_time),
    category: ce.event_type,
    description: ce.vendor_visit?.note ?? '',
    location,
    color,
  };
}

function mapUserEventToDisplay(ue: UserEvent, color?: string): CalendarEventDisplay {
  return {
    title: ue.event_title,
    description: ue.event_short_description,
    start: new Date(ue.event_start_time),
    end: new Date(ue.event_end_time),
    category: ue.status,
    location: [ue.event_location, ue.event_room].filter(Boolean).join(' · '),
    gameId: ue.event_game_id,
    color: color ? resolveColor(color) : undefined,
  };
}

// ── Small user-event card ────────────────────────────────────────────────────
function EventCard({ event }: { event: UserEvent }) {
  const theme = useTheme();
  const genconNum = event.event_game_id.match(/\d+$/)?.[0];
  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap>
          {event.event_title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {event.event_short_description}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Chip label={event.event_game_id} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
        {genconNum && (
          <Tooltip title="View on Gen Con">
            <IconButton
              size="small"
              component="a"
              href={`https://www.gencon.com/events/${genconNum}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'text.secondary' }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Card>
  );
}

// ── Related user row ─────────────────────────────────────────────────────────
function RelatedUserRow({
  r,
  onRemove,
}: {
  r: RelatedUser;
  onRemove: () => void;
}) {
  const label = RelationshipOptions.find(
    (opt) => opt.value === String(r.relationship),
  )?.label ?? String(r.relationship);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1,
        '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
      }}
    >
      <Avatar sx={{ width: 28, height: 28, bgcolor: r.color_code, fontSize: '0.75rem' }}>
        {r.name[0]}
      </Avatar>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
      <Tooltip title="Remove">
        <IconButton size="small" color="error" onClick={onRemove}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
const UserDetail = () => {
  const { user, loading, setUser } = useAuth();
  const theme = useTheme();

  const [mobilityAid, setMobilityAid] = useState('');
  const [stairPreference, setStairPreference] = useState('');
  const [color_code, setColorCode] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [newColor, setNewColor] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [calendarEventsRaw, setCalendarEventsRaw] = useState<CalendarEventRaw[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventDisplay[]>([]);

  const showSnackbar = (msg: string) => { setSnackbarMessage(msg); setSnackbarOpen(true); };

  const refreshUserData = async () => {
    try {
      const updated = await api.get(`/users/${user?.id}/`);
      if (setUser) setUser(updated.data);
    } catch (err) {
      console.error('Failed to refresh user data', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      api.get(`/calendar_events/?user=${user.id}`)
        .then((res) => setCalendarEventsRaw(res.data.results))
        .catch((err) => console.error('Failed to fetch calendar events:', err));
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      setMobilityAid(user.mobility_aid || '');
      setStairPreference(user.stair_preference || '');
      setColorCode(user.color_code || '');
    }
  }, [user]);

  useEffect(() => {
    // calendarEventsRaw already contains gencon_event entries that mirror user_events.
    // Only take vendor_visit / custom from the raw list to avoid duplicates.
    const vendorAndCustom = calendarEventsRaw
      .filter((ce) => ce.event_type !== 'gencon_event')
      .map(mapCalendarEventRawToDisplay);

    const userColor = user?.color_code || DEFAULT_EVENT_COLOR;
    const genconEvents = (user?.user_events ?? []).map((ue: UserEvent) =>
      mapUserEventToDisplay(ue, userColor),
    );

    setCalendarEvents([...vendorAndCustom, ...genconEvents]);
  }, [calendarEventsRaw, user]);

  // Dev console opens only via the DevConsoleButton click — not automatically.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/users/${user?.id}/`, {
        mobility_aid: mobilityAid || null,
        stair_preference: stairPreference || null,
        color_code: color_code || null,
      });
      showSnackbar('Preferences saved.');
      // Re-map with new color; preserve vendor/custom events from raw list
      const vendorAndCustom = calendarEventsRaw
        .filter((ce) => ce.event_type !== 'gencon_event')
        .map(mapCalendarEventRawToDisplay);
      const genconEvents = (user?.user_events ?? []).map((ue: UserEvent) =>
        mapUserEventToDisplay(ue, color_code || DEFAULT_EVENT_COLOR),
      );
      setCalendarEvents([...vendorAndCustom, ...genconEvents]);
    } catch {
      showSnackbar('Error updating preferences.');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;
  if (!user) return <Typography sx={{ p: 4 }}>You are not logged in.</Typography>;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2, py: 3 }}>

      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: user.color_code || 'primary.main',
            fontWeight: 700,
            fontSize: '1.2rem',
          }}
        >
          {user.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>{user.username}</Typography>
          {user.gencon_id && (
            <Typography variant="caption" color="text.secondary">
              Gen Con ID: {user.gencon_id}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Section tabs */}
      <Tabs
        value={tabValue}
        onChange={(_e, v) => setTabValue(v)}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="My Events" />
        <Tab label="Preferences" />
        <Tab label="Vendor Visits" />
      </Tabs>

      {/* ── Tab 0: Events ─────────────────────────────────────────────────── */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
              Scheduled Events ({user.user_events?.length ?? 0})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {user.user_events?.length ? (
                user.user_events.map((event: UserEvent) => (
                  <EventCard key={event.event_id} event={event} />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No events scheduled yet. Browse Events to get started.
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
              Watched Events
            </Typography>
            <WatchedEventList />
          </Grid>
        </Grid>
      )}

      {/* ── Tab 1: Preferences ────────────────────────────────────────────── */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Accessibility & color */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Accessibility &amp; Display
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Mobility Aid</InputLabel>
                    <Select value={mobilityAid} onChange={(e) => setMobilityAid(e.target.value)} label="Mobility Aid">
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="none">No Issues</MenuItem>
                      <MenuItem value="wheelchair">Wheelchair</MenuItem>
                      <MenuItem value="cane">Cane</MenuItem>
                      <MenuItem value="walker">Walker</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stair Preference</InputLabel>
                    <Select value={stairPreference} onChange={(e) => setStairPreference(e.target.value)} label="Stair Preference">
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="stairs">Prefer Stairs</MenuItem>
                      <MenuItem value="elevator">Prefer Elevator</MenuItem>
                      <MenuItem value="no_preference">No Preference</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Calendar Color</InputLabel>
                    <Select value={color_code} onChange={(e) => setColorCode(e.target.value)} label="Calendar Color">
                      {ColorOptions.map((color) => (
                        <MenuItem key={color.value} value={color.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color.value, flexShrink: 0 }} />
                            {color.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box>
                    <Button type="submit" variant="contained" color="primary">
                      Save preferences
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Friends & family */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Friends &amp; Family
                  </Typography>
                  <Button
                    size="small"
                    variant={showAddForm ? 'outlined' : 'contained'}
                    color={showAddForm ? 'inherit' : 'primary'}
                    startIcon={showAddForm ? undefined : <PersonAddIcon />}
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    {showAddForm ? 'Cancel' : 'Add'}
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {/* Add form */}
                {showAddForm && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                    <TextField label="Name" size="small" value={newName} onChange={(e) => setNewName(e.target.value)} fullWidth />
                    <FormControl fullWidth size="small">
                      <InputLabel>Relationship</InputLabel>
                      <Select value={newRelationship} onChange={(e) => setNewRelationship(e.target.value)} label="Relationship">
                        {RelationshipOptions.map((rel) => (
                          <MenuItem key={rel.value} value={rel.value}>{rel.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Color</InputLabel>
                      <Select value={newColor} onChange={(e) => setNewColor(e.target.value)} label="Color">
                        {ColorOptions.map((color) => (
                          <MenuItem key={color.value} value={color.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color.value, flexShrink: 0 }} />
                              {color.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={async () => {
                        try {
                          await api.post('/related_users/', {
                            user: user.id,
                            name: newName,
                            relationship: newRelationship,
                            color_code: newColor,
                          });
                          setShowAddForm(false);
                          setNewName('');
                          setNewRelationship('');
                          setNewColor('');
                          await refreshUserData();
                          showSnackbar(`${newName} added.`);
                        } catch {
                          console.error('Failed to save related user');
                        }
                      }}
                    >
                      Save
                    </Button>
                  </Box>
                )}

                {/* List */}
                {user.related_users?.length ? (
                  user.related_users.map((r: RelatedUser) => (
                    <RelatedUserRow
                      key={r.id}
                      r={r}
                      onRemove={async () => {
                        try {
                          await api.delete(`/related_users/${r.id}/`);
                          showSnackbar(`${r.name} removed.`);
                          await refreshUserData();
                        } catch {
                          console.error('Failed to delete related user');
                        }
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No group members yet.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 2: Vendor Visits ───────────────────────────────────────────── */}
      {tabValue === 2 && <VendorVisitList />}

      {/* ── Calendar (always visible below tabs) ─────────────────────────── */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 2 }}>
          Calendar
        </Typography>
        <Calendar userEvents={calendarEvents} />
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserDetail;
