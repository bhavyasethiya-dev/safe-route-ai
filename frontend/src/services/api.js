import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('safeRouteToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const geocodeSearch = async (query) => {
  const { data } = await api.get(`/geocode?q=${encodeURIComponent(query)}`);
  return data.results;
};

export const reverseGeocode = async (lat, lon) => {
  const { data } = await api.get(`/geocode/reverse?lat=${lat}&lon=${lon}`);
  return data;
};

export const fetchRoutes = async (fromLat, fromLon, toLat, toLon) => {
  const { data } = await api.get(
    `/routes?fromLat=${fromLat}&fromLon=${fromLon}&toLat=${toLat}&toLon=${toLon}`
  );
  return data;
};

export const fetchHeatmap = async (bounds) => {
  const { minLat, maxLat, minLon, maxLon } = bounds;
  const { data } = await api.get(
    `/heatmap?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}`
  );
  return data.points;
};

export const fetchEmergencyServices = async (lat, lon) => {
  const { data } = await api.get(`/emergency?lat=${lat}&lon=${lon}`);
  return data.services;
};

// Auth
export const loginUser = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const registerUser = async (name, email, password) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
};

export const updateProfile = async (updates) => {
  const { data } = await api.put('/auth/profile', updates);
  return data;
};

export const deleteProfile = async () => {
  const { data } = await api.delete('/auth/profile');
  return data;
};
