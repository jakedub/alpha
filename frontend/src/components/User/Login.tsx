import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
  Paper,
  useTheme,
  IconButton,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../auth/AuthContext';

const Login = () => {
  const theme = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const toggleShowPassword = () => setShowPassword(prev => !prev);

  const loginAndGetUserId = async (identifier: string, password: string): Promise<number> => {
    try {
      const response = await api.get('/users/');
      const user = response.data.results.find((u: any) =>
        u.email.toLowerCase() === identifier.toLowerCase() ||
        u.username.toLowerCase() === identifier.toLowerCase()
      );

      if (!user) {
        console.warn('No matching user found for identifier:', identifier);
        throw new Error('User not found');
      }

      return user.id;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await api.post('/login/', {
        email: identifier, // backend expects 'email', even if it's a username
        password,
      });
      if (res.data.status === 'ok') {
        await refreshUser();
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.response) {
        console.error('Login failed with response:', err.response.data);
      } else {
        console.error('Login failed:', err);
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Paper
        elevation={3}
        sx={{
          padding: theme.spacing(4),
          marginTop: theme.spacing(8),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="identifier"
            label="Email or Username"
            name="identifier"
            autoComplete="username"
            autoFocus
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={toggleShowPassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
