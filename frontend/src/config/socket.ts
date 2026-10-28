import { io } from "socket.io-client";

// Same origin as the API: env override for local dev, otherwise the page's own origin
const SERVER_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const socket = io(SERVER_URL, {
  autoConnect: false,
  withCredentials: true,
})