import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { admins } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before seeding.",
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("ADMIN_PASSWORD should be at least 12 characters.");
    process.exit(1);
  }

  const [existing] = await db()
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (existing) {
    console.error("An admin with this email already exists.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await db().insert(admins).values({ email, passwordHash });
  console.log("Admin user created.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
