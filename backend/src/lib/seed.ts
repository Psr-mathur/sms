import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

export async function seedAdminUser() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await prisma.user.create({
        data: {
          username: "admin",
          password: hashedPassword,
          name: "Administrator",
        },
      });
      logger.info("Default admin user created: username 'admin', password 'admin123'");
    }
  } catch (err) {
    logger.error(err, "Failed to seed default admin user");
  }
}
