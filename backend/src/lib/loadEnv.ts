import fs from "fs";
import path from "path";

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
