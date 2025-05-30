// components/ProtectedRoute.tsx
import React, { JSX, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/api';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    api.get('/me/', { withCredentials: true })
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) return <div>Loading...</div>;
  if (!authenticated) return <Navigate to="/login" />;

  return children;
};
export default ProtectedRoute;