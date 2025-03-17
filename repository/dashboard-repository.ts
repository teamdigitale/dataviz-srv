import { type Dashboard, Prisma, PrismaClient } from "@prisma/client";
import createRepository from "./repository-factory";

const prisma = new PrismaClient();
const repo = createRepository(prisma.dashboard);

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

async function findByIdWithIncludes(id: Dashboard["id"]) {
  return repo.findById(id, {
    include: { slots: { include: { chart: true } } },
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
  ...repo,
  findByUserId,
  findByIdWithIncludes,
  findSlots,
  updateSlots,
};
