import axios from 'axios';

// Get base URL from env if provided, otherwise default to relative path
const API_BASE = (import.meta as any).env.VITE_API_URL || 'https://furepay.onrender.com';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});