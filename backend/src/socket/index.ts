import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;
export let users: string[] = []

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🟢 Connected: ${socket.id}`);
    users.push(socket.id)

    socket.on("disconnect", () => {
      console.log(`🔴 Disconnected: ${socket.id}`);
      users.filter(u => u !== socket.id)
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }

  return io;
};