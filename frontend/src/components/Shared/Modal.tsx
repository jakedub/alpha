import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GroupIcon from '@mui/icons-material/Group';

// ── Data shape ────────────────────────────────────────────────────────────────

export interface EventModalData {
  title: string;
  gameId: string;
  start: Date;
  end: Date;
  location: string;
  room?: string | null;
  description: string;
  status?: string;
  attendees: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  wishlist:    '#f59e0b',
  purchased:   '#34d399',
  unavailable: '#6b7280',
};

function fmt(d: Date) {
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    hour:    'numeric',
    minute:  '2-digit',
    hour12:  true,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  event: EventModalData | null;
}

export default function EventDetailModal({ open, setOpen, event }: Props) {
  if (!event) return null;

  const statusColor = STATUS_COLORS[event.status ?? ''] ?? '#9ca3af';
  const genconNum   = event.gameId?.match(/\d+$/)?.[0];
  const genconUrl   = genconNum ? `https://www.gencon.com/events/${genconNum}` : null;

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ pr: 6, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
            {event.title}
          </Typography>
          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            sx={{ color: 'text.secondary', flexShrink: 0, mt: -0.25 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
          {event.status && (
            <Chip
              label={event.status}
              size="small"
              sx={{
                fontSize: '0.68rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                bgcolor: `${statusColor}1a`,
                color: statusColor,
                border: '1px solid',
                borderColor: `${statusColor}55`,
              }}
            />
          )}
          <Typography variant="caption" color="text.disabled" fontFamily="monospace">
            {event.gameId}
          </Typography>
        </Box>
      </DialogTitle>

      <Divider />

      {/* ── Body ── */}
      <DialogContent sx={{ pt: 2, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

        {/* Time */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
          <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
          <Box>
            <Typography variant="body2">{fmt(event.start)}</Typography>
            <Typography variant="caption" color="text.secondary">to {fmt(event.end)}</Typography>
          </Box>
        </Box>

        {/* Location */}
        {event.location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="body2">{event.location}</Typography>
          </Box>
        )}

        {/* Room */}
        {event.room && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <MeetingRoomIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="body2">{event.room}</Typography>
          </Box>
        )}

        {/* Attendees */}
        {event.attendees.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <GroupIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="body2">{event.attendees.join(', ')}</Typography>
          </Box>
        )}

        {/* Description */}
        {event.description && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.65 }}>
              {event.description}
            </Typography>
          </>
        )}

        {/* Gen Con link */}
        {genconUrl && (
          <Box sx={{ pt: 0.5 }}>
            <Link
              href={genconUrl}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: 'primary.main' }}
            >
              View on Gen Con
              <OpenInNewIcon sx={{ fontSize: 13 }} />
            </Link>
          </Box>
        )}

      </DialogContent>
    </Dialog>
  );
}
