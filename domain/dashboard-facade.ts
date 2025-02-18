import type { Prisma } from "@prisma/client";
import * as db from "../lib/db";
import type { ParsedToken } from "../types";

//#region query
const findAll = async (req: any, res: any, next: any) => {
  try {
    const user: ParsedToken = req.user;
    const id = user.userId;
    const results = await db.findDashboardsByUserId(id);
    res.json(results);
  } catch (err) {
    next(err);
  }
};

const findById = async (req: any, res: any, next: any) => {
  try {
    const id = req.params.id;
    const user: ParsedToken = req.user;
    const { data } = req.body;
    const result = await db.findDashboardById(id);
    res.json(result);
    return res.json({ user, data });
  } catch (err) {
    next(err);
  }
};
//#endregion

//#region command
const create = async (req: any, res: any, next: any) => {
  try {
    const user: ParsedToken = req.user;
    const { body } = req;
    const chartData = {
      userId: user.userId,
      ...body,
    };
    console.log(chartData);
    const result = await db.createDashboard(chartData);

    return res.status(201).json(result);
  } catch (err) {
    console.log(err);
    next(err);
  }
};
const update = async (req: any, res: any, next: any) => {
  try {
    const user: ParsedToken = req.user;
    const dashboardId = req.params.id;
    const dashboard = await db.findDashboardById(dashboardId);
    if (!dashboard) {
      return res.json({ message: "Not Found" }).status(404);
    }
    if (dashboard.userId !== user.userId) {
      return res.json({ message: "Not Authorized" }).status(401);
    }
    console.log("Updating dashboard", dashboardId);
    const dashboardData = req.body;
    console.log("Dashboard Data", dashboardData);
    const result = await db.updateDashboard(dashboardId, dashboardData);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};
const deleteById = async (req: any, res: any, next: any) => {
  try {
    const user: ParsedToken = req.user;
    const dashboardId = req.params.id;
    const dashboard = await db.findDashboardById(dashboardId);
    if (!dashboard) {
      return res.json({ message: "Not Found" }).status(404);
    }
    if (dashboard.userId !== user.userId) {
      return res.json({ message: "Not Authorized" }).status(401);
    }
    const result = await db.deleteDashboard(dashboardId);
    return res.status(204).json();
  } catch (err) {
    next(err);
  }
};
//#endregion

//#region slots
type TSlot = Prisma.XOR<
  Prisma.SlotCreateWithoutDashboardInput,
  Prisma.SlotUncheckedCreateWithoutDashboardInput
>;

type TUpsert = Prisma.SlotUpsertWithWhereUniqueWithoutDashboardInput;

const updateSlots = async (req: any, res: any, next: any) => {
  try {
    const user: ParsedToken = req.user;
    const dashboardId = req.params.id;
    const dashboard = await db.findDashboardById(dashboardId);
    if (!dashboard) {
      return res.json({ message: "Not Found" }).status(404);
    }
    if (dashboard.userId !== user.userId) {
      return res.json({ message: "Not Authorized" }).status(401);
    }
    console.log("Updating dashboard", dashboardId);
    const dashboardData = req.body;
    console.log("Dashboard Data", dashboardData);
    const result = await db.updateDashboardSlots(dashboardId, {
      ...dashboardData,
      slots: {
        upsert: dashboardData.slots.map(
          (slot: { settings: any; chartId: any }) =>
            ({
              settings: slot.settings,
              chartId: slot.chartId,
            } satisfies TSlot)
        ) as TUpsert,
        // createMany: [
        //   dashboardData.slots.map((s: any) => ({
        //     where: {
        //       // dashboardId_chartId: {
        //       chartId: s.chartId,
        //       dashboardId: s.dashboardId,
        //       // },
        //     },
        //     data: s,
        //   })),
        // ],
      } satisfies Prisma.SlotUpdateManyWithoutDashboardNestedInput,
    });
    return res.json(result);
  } catch (err) {
    next(err);
  }
};
//#endregion

export default { findAll, findById, create, update, deleteById, updateSlots };
