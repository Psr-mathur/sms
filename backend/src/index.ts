import fs from "fs";
import path from "path";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { seedAdminUser } from "./lib/seed";

// Load environment variables from .env file if present
try {
  if (fs.existsSync(".env")) {
    process.loadEnvFile(".env");
  } else {
    const rootEnv = path.resolve(import.meta.dirname, "..", "..", ".env");
    if (fs.existsSync(rootEnv)) {
      process.loadEnvFile(rootEnv);
    }
  }
} catch (e) {
  // Ignore env loading errors
}

const rawPort = process.env["PORT"] || "5001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async () => {
  logger.info({ port }, "Backend Server listening");
  await seedAdminUser();
});
