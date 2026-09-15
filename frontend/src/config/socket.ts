import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const socket = io(SERVER_URL, {
  autoConnect: false,
  withCredentials: true,
})