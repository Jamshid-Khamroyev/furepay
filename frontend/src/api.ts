import axios from 'axios';

// Get base URL from env if provided, otherwise default to relative path
const API_BASE = (import.meta as any).env.VITE_API_URL || 'https://furepay.onrender.com';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  // Don't leave the app on a spinner forever when the API is unreachable (slow mobile networks, cold starts)
  timeout: 20000,
});