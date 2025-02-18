import { type Dashboard, type Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createDashboard(data: Prisma.DashboardCreateInput) {
  return prisma.dashboard.create({ data });
}

export function findDashboardById(id: Dashboard["id"]) {
  return prisma.dashboard.findUnique({
    where: {
      id,
    },
  });
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

export async function deleteDashboard(id: Dashboard["id"]) {
  return prisma.dashboard.delete({
    where: {
      id,
    },
  });
}

export function findSlotsByDashboardId(id: Dashboard["id"]) {
  return prisma.dashboard.findUnique({
    where: {
      id,
    },
    include: { slots: true },
  });
}

type SlotsPayload = {
  dashboardId: string;
  chartId: string;
  settings: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}[];

export async function updateDashboardSlots(
  dashboardId: Dashboard["id"],
  {
    toCreate,
    toUpdate,
    toDelete,
  }: {
    toCreate: SlotsPayload;
    toUpdate: SlotsPayload;
    toDelete: SlotsPayload;
  }
) {
  //TODO: this method will be refactored
  const model = prisma.slot;

  const deletes = model.deleteMany({
    where: {
      dashboardId,
    },
  });

  const creates = model.createMany({
    data: [...toCreate, ...toUpdate].map((i) => ({
      ...i,
      dashboardId,
      settings: i.settings as Prisma.InputJsonValue,
    })),
  });

  return await prisma
    .$transaction([deletes, creates])
    .then(([deleteCount, createCount]) => ({
      delete: deleteCount,
      create: createCount,
    }))
    .catch((r) => console.log("transaction", r));
}
