import { PrismaClient } from "../../prisma/generated/default";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;

// The adapter ignores the ?schema= URL param that `prisma migrate` honors, so pass it explicitly.
const schema = new URL(connectionString).searchParams.get("schema") ?? undefined;

const adapter = new PrismaPg({ connectionString }, { schema });

export const prisma = new PrismaClient({
  adapter,
});