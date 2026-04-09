import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
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
