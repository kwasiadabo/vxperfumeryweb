import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
// Origin the backend serves /uploads from — e.g. https://vxperfumery.onrender.com
const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: apiBaseUrl });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Product imageUrl values are relative paths like "/uploads/..." returned by the API —
// resolve them against the backend's origin so they work when the frontend is a separate deploy.
export function resolveAssetUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url}`;
}

export default api;
