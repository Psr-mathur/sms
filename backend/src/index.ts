import "./lib/loadEnv";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { seedAdminUser } from "./lib/seed";


const rawPort = process.env["PORT"] || "5001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async () => {
  logger.info({ port }, "Backend Server listening");
  await seedAdminUser();
});
