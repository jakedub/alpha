import React, { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import api from '../../api/api';

interface Notification {
  id: number;
  event_game_id: string | null;
  event_title: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const POLL_MS = 60_000;

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = () =>
    api.get('/notifications/unread-count/').then((r) => setUnreadCount(r.data.count ?? 0)).catch(() => {});

  const fetchAll = () =>
    api.get('/notifications/').then((r) => setNotifications(r.data.results ?? r.data ?? [])).catch(() => {});

  useEffect(() => {
    fetchCount();
    timer.current = setInterval(fetchCount, POLL_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(e.currentTarget);
    fetchAll();
  };

  const markAllRead = () =>
    api.post('/notifications/mark-all-read/').then(() => {
      setUnreadCount(0);
      setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
    }).catch(() => {});

  const markRead = (id: number) =>
    api.post(`/notifications/${id}/mark-read/`).then(() => {
      setNotifications((p) => p.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    }).catch(() => {});

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          size="medium"
          onClick={handleOpen}
          aria-label="notifications"
          sx={{ color: unreadCount > 0 ? 'primary.main' : 'text.secondary' }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ elevation: 3, sx: { mt: 0.5, width: 360, maxHeight: 480, borderRadius: 2, display: 'flex', flexDirection: 'column' } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Typography variant="subtitle2" fontWeight={600}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllRead} sx={{ fontSize: '0.75rem' }}>Mark all read</Button>
          )}
        </Box>
        <Divider />
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No notifications yet.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((n, i) => (
                <React.Fragment key={n.id}>
                  {i > 0 && <Divider component="li" />}
                  <ListItem
                    alignItems="flex-start"
                    onClick={() => !n.is_read && markRead(n.id)}
                    sx={{
                      cursor: n.is_read ? 'default' : 'pointer',
                      bgcolor: n.is_read ? 'transparent' : 'action.hover',
                      px: 2, py: 1.5,
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={n.is_read ? 400 : 600}>{n.event_title ?? 'Event update'}</Typography>}
                      secondary={
                        <>
                          <Typography variant="caption" component="span" display="block" sx={{ mt: 0.25 }}>{n.message}</Typography>
                          <Typography variant="caption" color="text.disabled" component="span" display="block" sx={{ mt: 0.5 }}>{fmt(n.created_at)}</Typography>
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}
