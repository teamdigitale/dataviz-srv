import type { Chart, Dashboard, Prisma, User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

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

export function findDashboardById(id: Dashboard["id"]) {
  return prisma.dashboard.findUnique({
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

export async function createDashboard(data: Prisma.DashboardCreateInput) {
  return prisma.dashboard.create({ data });
}

export async function findDashboardsByUserId(userId: string) {
  return prisma.dashboard.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function updateDashboard(
  id: Dashboard["id"],
  data: Prisma.DashboardUpdateInput
) {
  return prisma.dashboard.update({
    where: {
      id,
    },
    data,
  });
}
