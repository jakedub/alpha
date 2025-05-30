import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Log CSRF token before every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('csrftoken');

  if (token && config.headers) {
    config.headers['X-CSRFToken'] = token;
  }
  return config;
});

export default api;