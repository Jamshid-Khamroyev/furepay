import "dotenv/config";
import http from 'http'
import app from "./src/app.ts";
import { prisma } from "./src/config/db.ts";
import { initSocket } from "./src/socket/index.ts";

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
    const server = http.createServer(app);
    initSocket(server);
    server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

start();