import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PersonIcon from '@mui/icons-material/Person';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import api from '../../api/api';
import { Event } from '../../models/events';
import { useAuth } from '../../auth/AuthContext';

type RelatedUser = { id: number; name: string; color_code: string; relationship: string };

const EVENT_TYPE_COLORS: Record<string, string> = {
  BGM: '#00F0FF', RPG: '#7c3aed', TCG: '#FFA900', SEM: '#00FF81',
  NMN: '#FF6800', LRP: '#ec4899', MHE: '#06b6d4', WKS: '#f59e0b',
  EGS: '#84cc16', ANI: '#a855f7',
};
function eventTypeColor(type: string): string {
  return EVENT_TYPE_COLORS[type?.toUpperCase()] ?? '#6b7280';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── Small metadata row ────────────────────────────────────────────────────────
function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.75 }}>
      <Box sx={{ color: 'text.secondary', mt: 0.1, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.62rem', fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="body2">{value}</Typography>
      </Box>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const theme = useTheme();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEvent, setUserEvent] = useState<any | null>(null);
  const [relatedUsers, setRelatedUsers] = useState<RelatedUser[]>([]);
  const [saving, setSaving] = useState<string | null>(null); // which button is saving
  const [ffDialogOpen, setFfDialogOpen] = useState(false);
  const [selectedRelated, setSelectedRelated] = useState<Set<number>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });

  const showSnackbar = (msg: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, msg, severity });

  // Fetch event + current user's schedule entry for it
  const loadUserEvent = async (gameId: string) => {
    try {
      const res = await api.get('/user_events/');
      const results = res.data.results ?? res.data ?? [];
      const match = results.find((ue: any) => ue.event_game_id === gameId);
      setUserEvent(match ?? null);
      if (match?.related_users) {
        setSelectedRelated(new Set(match.related_users.map((ru: any) => ru.id)));
      }
    } catch {
      // not logged in — no user event
    }
  };

  useEffect(() => {
    setLoading(true);
    api.get<Event>(`/events/${id}/`)
      .then((res) => {
        setEvent(res.data);
        if (res.data.game_id) loadUserEvent(res.data.game_id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    api.get('/related_users/')
      .then((res) => setRelatedUsers(res.data.results ?? res.data ?? []))
      .catch(() => {});
  }, [id]);

  // ── Schedule actions ────────────────────────────────────────────────────────

  const addOrUpdate = async (status: 'wishlist' | 'purchased', selfAssigned: boolean, relatedIds: number[]) => {
    if (!event?.game_id) return;
    const payload = { event: event.game_id, status, self_assigned: selfAssigned, related_user_ids: relatedIds };
    if (userEvent) {
      const res = await api.patch(`/user_events/${userEvent.id}/`, { status, self_assigned: selfAssigned, related_user_ids: relatedIds });
      setUserEvent(res.data);
    } else {
      const res = await api.post('/user_events/', payload);
      setUserEvent(res.data);
    }
  };

  const handleWishlist = async () => {
    setSaving('wishlist');
    try {
      const currentRelated = userEvent?.related_users?.map((ru: any) => ru.id) ?? [];
      await addOrUpdate('wishlist', true, currentRelated);
      showSnackbar('Added to wishlist');
    } catch {
      showSnackbar('Failed to update', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handlePurchased = async () => {
    setSaving('purchased');
    try {
      const currentRelated = userEvent?.related_users?.map((ru: any) => ru.id) ?? [];
      await addOrUpdate('purchased', true, currentRelated);
      showSnackbar('Marked as purchased');
    } catch {
      showSnackbar('Failed to update', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleFFOpen = () => {
    // Pre-populate from current userEvent
    if (userEvent?.related_users) {
      setSelectedRelated(new Set(userEvent.related_users.map((ru: any) => ru.id)));
    } else {
      setSelectedRelated(new Set());
    }
    setFfDialogOpen(true);
  };

  const handleFFConfirm = async () => {
    setFfDialogOpen(false);
    setSaving('ff');
    try {
      const ids = Array.from(selectedRelated);
      // self_assigned stays true if user already has self on event, else false (F&F only)
      const selfAssigned = userEvent?.self_assigned ?? false;
      const status = userEvent?.status ?? 'purchased';

      if (ids.length === 0 && !selfAssigned) {
        // Nothing assigned at all — remove
        if (userEvent) {
          await api.delete(`/user_events/${userEvent.id}/`);
          setUserEvent(null);
          showSnackbar('Removed from schedule');
        }
      } else {
        await addOrUpdate(status, selfAssigned, ids);
        showSnackbar(ids.length > 0 ? 'Friends & family updated' : 'Updated');
      }
    } catch {
      showSnackbar('Failed to update', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async () => {
    if (!userEvent) return;
    setSaving('remove');
    try {
      await api.delete(`/user_events/${userEvent.id}/`);
      setUserEvent(null);
      setSelectedRelated(new Set());
      showSnackbar('Removed from schedule');
    } catch {
      showSnackbar('Failed to remove', 'error');
    } finally {
      setSaving(null);
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────
  const isSelf = userEvent?.self_assigned === true;
  const isWishlist = isSelf && userEvent?.status === 'wishlist';
  const isPurchased = isSelf && userEvent?.status === 'purchased';
  const assignedRelated: any[] = userEvent?.related_users ?? [];
  const hasFF = assignedRelated.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
      <CircularProgress />
    </Box>
  );
  if (!event) return <Typography sx={{ p: 4 }}>Event not found.</Typography>;

  const stripColor = eventTypeColor(event.event_type);
  const genconNum = event.game_id?.match(/\d+$/)?.[0];
  const genconUrl = genconNum ? `https://www.gencon.com/events/${genconNum}` : null;
  const durationMins = event.start_time && event.end_time
    ? Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000)
    : null;
  const isFree = !event.cost || Number(event.cost) === 0;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2, py: 3 }}>

      {/* ── Back nav ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Tooltip title="Back to events">
          <IconButton component={Link} to="/events" size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" color="text.secondary">Events</Typography>
        <Typography variant="caption" color="text.secondary">/</Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>{event.title}</Typography>
      </Box>

      {/* ── My Schedule (horizontal) ── */}
      <Card sx={{ mb: 2, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.08em', mr: 1, whiteSpace: 'nowrap' }}>
              My Schedule
            </Typography>

            {/* Status banner inline */}
            {userEvent && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: `${isPurchased ? '#34d399' : '#f59e0b'} !important` }} />}
                label={isPurchased ? 'Purchased' : isWishlist ? 'On Wishlist' : 'Scheduled (F&F)'}
                size="small"
                sx={{
                  bgcolor: isPurchased ? 'rgba(52,211,153,0.08)' : 'rgba(245,158,11,0.08)',
                  color: isPurchased ? '#34d399' : '#f59e0b',
                  border: `1px solid ${isPurchased ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  fontWeight: 600, fontSize: '0.7rem', mr: 0.5,
                }}
              />
            )}
            {isSelf && hasFF && (
              <Typography variant="caption" color="text.secondary">you + others</Typography>
            )}
            {!isSelf && hasFF && (
              <Typography variant="caption" color="text.secondary">{assignedRelated.map((r) => r.name).join(', ')}</Typography>
            )}

            {/* Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Action buttons — horizontal */}
            <Button
              size="small"
              variant={isWishlist ? 'contained' : 'outlined'}
              startIcon={isWishlist ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              onClick={handleWishlist}
              disabled={saving !== null}
              sx={{
                ...(isWishlist && { bgcolor: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)', '&:hover': { bgcolor: 'rgba(245,158,11,0.25)' } }),
                ...(!isWishlist && { color: 'text.secondary' }),
              }}
            >
              {saving === 'wishlist' ? 'Saving…' : isWishlist ? 'Wishlist' : '+ Wishlist'}
            </Button>

            <Button
              size="small"
              variant={isPurchased ? 'contained' : 'outlined'}
              startIcon={<ConfirmationNumberIcon />}
              onClick={handlePurchased}
              disabled={saving !== null}
              sx={{
                ...(isPurchased && { bgcolor: 'rgba(52,211,153,0.15)', color: '#34d399', borderColor: 'rgba(52,211,153,0.4)', '&:hover': { bgcolor: 'rgba(52,211,153,0.25)' } }),
                ...(!isPurchased && { color: 'text.secondary' }),
              }}
            >
              {saving === 'purchased' ? 'Saving…' : isPurchased ? 'Purchased' : '+ Purchased'}
            </Button>

            <Button
              size="small"
              variant={hasFF ? 'contained' : 'outlined'}
              startIcon={<FamilyRestroomIcon />}
              onClick={handleFFOpen}
              disabled={saving !== null || relatedUsers.length === 0}
              sx={{
                ...(hasFF && { bgcolor: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)', '&:hover': { bgcolor: 'rgba(56,189,248,0.25)' } }),
                ...(!hasFF && { color: 'text.secondary' }),
              }}
            >
              {saving === 'ff' ? 'Saving…' : hasFF ? `F&F (${assignedRelated.length})` : relatedUsers.length === 0 ? 'No group' : '+ F&F'}
            </Button>

            {isSelf && (
              <Tooltip title={isWishlist ? 'Move to Purchased' : 'Move to Wishlist'}>
                <IconButton size="small" onClick={isWishlist ? handlePurchased : handleWishlist} disabled={saving !== null} sx={{ color: 'text.secondary' }}>
                  <SwapHorizIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {userEvent && (
              <Tooltip title="Remove from schedule">
                <IconButton size="small" onClick={handleRemove} disabled={saving !== null} sx={{ color: 'error.main' }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* F&F chips when assigned */}
          {hasFF && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, pl: 0.5 }}>
              {assignedRelated.map((ru: any) => (
                <Chip
                  key={ru.id}
                  avatar={<Avatar sx={{ bgcolor: `${ru.color_code} !important`, width: 18, height: 18, fontSize: '0.55rem' }}>{ru.name[0]}</Avatar>}
                  label={ru.name}
                  size="small"
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Header card ── */}
      <Card
        sx={{
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          borderLeft: `4px solid ${stripColor}`,
        }}
      >
        {/* Subtle color glow behind header */}
        <Box
          sx={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
            background: `linear-gradient(90deg, ${stripColor}0d 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
        <CardContent sx={{ position: 'relative', pb: '16px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Type + cost badges */}
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  label={event.event_type}
                  size="small"
                  sx={{ bgcolor: `${stripColor}22`, color: stripColor, border: `1px solid ${stripColor}55`, fontWeight: 700, fontSize: '0.7rem' }}
                />
                <Chip
                  label={isFree ? 'Free' : `$${event.cost}`}
                  size="small"
                  sx={{
                    bgcolor: isFree ? `${theme.palette.primary.main}1a` : 'transparent',
                    color: isFree ? theme.palette.primary.main : 'text.secondary',
                    border: `1px solid ${isFree ? theme.palette.primary.main + '55' : theme.palette.divider}`,
                    fontWeight: 600, fontSize: '0.7rem',
                  }}
                />
                {event.tickets_available !== undefined && (
                  <Chip
                    label={event.tickets_available > 0 ? `${event.tickets_available} tickets` : 'Sold out'}
                    size="small"
                    sx={{
                      bgcolor: event.tickets_available > 0 ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                      color: event.tickets_available > 0 ? '#34d399' : '#f87171',
                      border: 'none', fontWeight: 600, fontSize: '0.7rem',
                    }}
                  />
                )}
              </Box>

              <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.3, mb: 1 }}>
                {event.title}
              </Typography>

              {event.short_description && (
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {event.short_description}
                </Typography>
              )}
            </Box>

            {/* Gen Con link */}
            {genconUrl && (
              <Tooltip title="View on Gen Con website">
                <IconButton
                  component="a"
                  href={genconUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ color: 'text.secondary', flexShrink: 0 }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* ID + gaming group */}
          <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.disabled" fontFamily="monospace">{event.game_id}</Typography>
            {event.gaming_group && (
              <Typography variant="caption" color="text.disabled">by {event.gaming_group}</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ── Body: two columns — left = Description, right = Details + Event Info ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 280px' }, gap: 3, alignItems: 'stretch' }}>

        {/* Left: Description */}
        <Box>
          {event.long_description ? (
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.08em' }}>
                  Description
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line', color: 'text.secondary', textAlign: 'left', fontSize: '1rem' }}>
                  {event.long_description}
                </Typography>
              </CardContent>
            </Card>
          ) : <Box />}
        </Box>

        {/* ── Right: compact Details + metadata ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Key details — compact */}
          <Card>
            <CardContent sx={{ pb: '12px !important' }}>
              <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.08em', fontSize: '0.6rem' }}>
                Details
              </Typography>
              <Divider sx={{ my: 0.75 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {event.start_time && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.4 }}>
                    <AccessTimeIcon sx={{ fontSize: 13, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.4 }}>{fmtDate(event.start_time)}</Typography>
                      {durationMins && <Typography variant="caption" color="text.secondary">{durationMins} min</Typography>}
                    </Box>
                  </Box>
                )}
                {event.location?.name && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                    <LocationOnIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
                    <Typography variant="caption">{event.location.name}</Typography>
                  </Box>
                )}
                {event.room?.name && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                    <MeetingRoomIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
                    <Typography variant="caption">{event.room.name}{event.table_number ? ` · Table ${event.table_number}` : ''}</Typography>
                  </Box>
                )}
                {event.gm_names && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                    <PersonIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
                    <Typography variant="caption">{event.gm_names}</Typography>
                  </Box>
                )}
                {(event.minimum_players || event.maximum_players) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                    <PersonIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
                    <Typography variant="caption">{[event.minimum_players, event.maximum_players].filter(Boolean).join(' – ')} players</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Metadata card */}
          <Card>
            <CardContent sx={{ pb: '12px !important' }}>
              <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.08em', fontSize: '0.6rem' }}>
                Event Info
              </Typography>
              <Divider sx={{ my: 0.75 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {event.game_system && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">Game System</Typography>
                    <Typography variant="caption" fontWeight={500}>{event.game_system}</Typography>
                  </Box>
                )}
                {event.rules_edition && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">Rules Edition</Typography>
                    <Typography variant="caption" fontWeight={500}>{event.rules_edition}</Typography>
                  </Box>
                )}
                {event.experience_required && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">Experience</Typography>
                    <Typography variant="caption" fontWeight={500}>{event.experience_required}</Typography>
                  </Box>
                )}
                {event.minimum_age && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">Min Age</Typography>
                    <Typography variant="caption" fontWeight={500}>{event.minimum_age}</Typography>
                  </Box>
                )}
                {event.materials_required && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">Materials</Typography>
                    <Typography variant="caption" fontWeight={500}>{event.materials_required_details || 'Required'}</Typography>
                  </Box>
                )}
                {event.tournament && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">Tournament</Typography>
                    <Typography variant="caption" fontWeight={500}>Round {event.round_number} of {event.total_rounds}</Typography>
                  </Box>
                )}
                {event.attendee_registration && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">Registration</Typography>
                    <Typography variant="caption" fontWeight={500}>{event.attendee_registration}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* ── Friends & Family dialog ── */}
      <Dialog
        open={ffDialogOpen}
        onClose={() => setFfDialogOpen(false)}
        PaperProps={{ sx: { minWidth: 300, borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>Add Friends &amp; Family</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Select who to add this event for. If you also clicked Purchased or Wishlist, it will show on your schedule too.
          </Typography>
          {relatedUsers.map((ru) => (
            <Box key={ru.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
              <Checkbox
                checked={selectedRelated.has(ru.id)}
                onChange={() => {
                  setSelectedRelated((prev) => {
                    const next = new Set(prev);
                    next.has(ru.id) ? next.delete(ru.id) : next.add(ru.id);
                    return next;
                  });
                }}
                size="small"
              />
              <Avatar sx={{ width: 24, height: 24, bgcolor: ru.color_code, fontSize: '0.65rem' }}>
                {ru.name[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={500}>{ru.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{ru.relationship}</Typography>
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setFfDialogOpen(false)}>Cancel</Button>
          <Button size="small" variant="contained" onClick={handleFFConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EventDetail;
