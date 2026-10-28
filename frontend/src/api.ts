import axios from 'axios';

// Get base URL from env if provided; otherwise use the origin the app is served from
// (Express serves the built client, so API and client share one origin in production)
const API_BASE = (import.meta as any).env.VITE_API_URL || window.location.origin;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  // Don't leave the app on a spinner forever when the API is unreachable (slow mobile networks, cold starts)
  timeout: 20000,
});