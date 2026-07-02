import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// DATABASE_URL: "file:./dev.db" for local SQLite, or "libsql://...turso.io" for a remote Turso database.
const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

// Only bare local paths need the "file:" scheme added; libsql/http(s) URLs pass through as-is.
function getLibsqlUrl(url: string) {
  if (url.startsWith("file:") || url.startsWith("libsql:") || url.startsWith("http")) return url;
  return `file:${url}`;
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof buildClient> };

function buildClient() {
  const adapter = new PrismaLibSql({
    url: getLibsqlUrl(dbUrl),
    ...(authToken ? { authToken } : {}),
  });
  // PrismaClient type in Prisma 7 requires adapter option
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>;
}

export const prisma: InstanceType<typeof PrismaClient> =
  globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
