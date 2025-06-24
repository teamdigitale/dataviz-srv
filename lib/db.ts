import type { Chart, Prisma, User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import generatePin from "./pin";

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

export function findChartsByUSerId(id: User["id"]) {
  return prisma.chart.findMany({
    where: {
      userId: id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export function createChart(data: Prisma.ChartCreateInput) {
  return prisma.chart.create({ data });
}

export function publishChart(id: Chart["id"], publish: boolean) {
  return prisma.chart.update({
    where: {
      id,
    },
    data: {
      publish,
    },
  });
}

export function updateChart(id: Chart["id"], data: Prisma.ChartUpdateInput) {
  return prisma.chart.update({
    where: {
      id,
    },
    data,
  });
}

export function deleteChart(id: Chart["id"]) {
  return prisma.chart.delete({
    where: {
      id,
    },
  });
}

export async function disconnect() {
  return prisma.$disconnect();
}

export async function findCodeByUid(userId: string) {
  const result = await prisma.codes.findFirst({
    where: {
      userId,
    },
  });
  let expired = true;

  if (result) {
    expired =
      new Date(result.updatedAt).getMilliseconds() + result?.expire * 1000 <
      Date.now();
  }

  return expired ? null : result;
}

export async function createCode(userId: string) {
  const code = generatePin();
  await prisma.codes.deleteMany({
    where: {
      userId,
    },
  });
  await prisma.codes.create({
    data: {
      userId,
      code,
    },
  });
  return code;
}

export async function setVerifyed(id: string) {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      verifyed: true,
    },
  });
}

export async function changePassword(id: string, newPassword: string) {
  const password = bcrypt.hashSync(newPassword, 12);
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      password,
    },
  });
}
