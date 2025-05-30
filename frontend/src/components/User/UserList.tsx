// frontend/src/components/UserList.tsx
import { useEffect, useState } from 'react';
import api from '../../api/api';
import type { User } from '../../models/user';
import { IconButton, useTheme } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {Link} from 'react-router-dom';

const UserList = () => {
  const [Users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

    useEffect(() => {
    api.get('/users/')
        .then(res => {
        setUsers(res.data.results); // <-- FIX: assign results array, not the full object
        })
        .catch(() => setError('Failed to load users.'));
    }, []);
  return (
    <div>
      <h2>Users</h2>
      {error && <p>{error}</p>}
      <ul>
        {Users.map(User => (
          <><li key={User.id}>{User.username} (Email {User.email})</li>
          <IconButton component={Link}
                to={`/users/${User.id}`}
                aria-label="View event details"
                sx={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: '50%',
                    color: theme.palette.text.disabled,
                    padding: '8px',
                    '&:hover': {
                        backgroundColor: '#c0c0c0',
                    },
                }}
            >
                <OpenInNewIcon />
            </IconButton></>
        ))}
      </ul>
    </div>
  );
};

export default UserList;