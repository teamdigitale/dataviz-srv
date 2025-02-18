import { type Dashboard, type Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function create(data: Prisma.DashboardCreateInput) {
  return prisma.dashboard.create({ data });
}

function findById(id: Dashboard["id"]) {
  return prisma.dashboard.findUnique({
    where: {
      id,
    },
  });
}

async function findByUserId(userId: string) {
  return prisma.dashboard.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

async function update(id: Dashboard["id"], data: Prisma.DashboardUpdateInput) {
  return prisma.dashboard.update({
    where: {
      id,
    },
    data,
  });
}

async function deleteById(id: Dashboard["id"]) {
  return prisma.dashboard.delete({
    where: {
      id,
    },
  });
}

function findSlots(id: Dashboard["id"]) {
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

async function updateSlots(
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

export default {
  create,
  findById,
  findByUserId,
  update,
  deleteById,
  findSlots,
  updateSlots,
};
