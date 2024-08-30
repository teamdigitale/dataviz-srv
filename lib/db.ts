import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function checkDB() {
  const users = await prisma.user.findMany({});
  return users;
}
