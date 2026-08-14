import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(url, { prepare: false });

  return drizzle({ client, schema });
}

let instance: ReturnType<typeof createDb> | undefined;

export function db() {
  if (!instance) {
    instance = createDb();
  }
  return instance;
}
