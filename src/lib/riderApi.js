import axios from 'axios';

// Riders have their own token, separate from customer/admin sessions
const riderApi = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
riderApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('vx_rider_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default riderApi;
