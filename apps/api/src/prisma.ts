import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "./generated/prisma/index.js";

declare global {
  var prisma: PrismaClient | undefined;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDbPath = pathToFileURL(join(__dirname, "..", "prisma", "dev.db")).href;

const adapter = new PrismaBetterSqlite3({
  url: process.env["DATABASE_URL"] ?? defaultDbPath,
});

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
