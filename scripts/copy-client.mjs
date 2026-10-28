// Replaces backend/public with the fresh Vite build so Express serves the current client.
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = `${root}frontend/dist`;
const publicDir = `${root}backend/public`;

if (!existsSync(dist)) {
  console.error("frontend/dist not found. Run the frontend build first.");
  process.exit(1);
}

rmSync(publicDir, { recursive: true, force: true });
cpSync(dist, publicDir, { recursive: true });
console.log("Copied frontend/dist -> backend/public");
