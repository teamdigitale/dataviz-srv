import * as bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import type { User, Chart, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

export function getUsers() {
  return prisma.user.findMany({});
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export function createUserByEmailAndPassword(user: Prisma.UserCreateInput) {
  user.password = bcrypt.hashSync(user.password, 12);
  return prisma.user.create({
    data: user,
  });
}

export function findUserById(id: User["id"]) {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
}

export function findChartById(id: Chart["id"]) {
  return prisma.chart.findUnique({
    where: {
      id,
    },
  });
}

export function findChartByUSerId(id: User["id"]) {
  return prisma.chart.findMany({
    where: {
      userId: id,
    },
  });
}
