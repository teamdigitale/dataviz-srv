import type { Prisma } from "@prisma/client";
import { Router } from "express";
import * as z from "zod";
import facade from "../domain/dashboard-facade";
import * as db from "../lib/db";
import { requireUser, validateRequest } from "../lib/middlewares";
import type { ParsedToken } from "../types";

const router = Router();

const detailSchema = z.object({
  id: z.string({
    required_error: "Id is required",
  }),
});

// const slotSchema = z.object({
//   chartId: z.string(),
//   dashboardId: z.string(),
//   settings: z.optional(z.string()),
// });

const slotSchema = z.object({
  chartId: z.string(), // Ignoriamo la validazione specifica per Chart
  settings: z.object({}).passthrough().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

const createDashboardSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  // chart: z.string({
  //   required_error: "Chart type is required",
  // }),
  config: z.unknown().optional(),
  data: z.unknown().optional(),
  remoteUrl: z.string().nullable().optional(),
  isRemote: z.boolean().optional(),
  publish: z.boolean().optional(),
  preview: z.string().nullable().optional(),
});

const updateDashboardSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  // chart: z.string().optional(),
  config: z.unknown().optional(),
  data: z.unknown().optional(),
  publish: z.boolean().optional(),
  remoteUrl: z.string().nullable().optional(),
  isRemote: z.boolean().optional(),
  id: z.string().optional(),
  preview: z.string().nullable().optional(),
  slots: z.array(slotSchema).optional(),
});

const updateSlotsSchema = z.object({
  slots: z.array(slotSchema),
});

/** Index */
router.get("/", requireUser, facade.findAll);

/** Get :ID */
router.get(
  "/:id",
  [validateRequest({ params: detailSchema }), requireUser],
  facade.findById
);

/** Create */
router.post(
  "/",
  [validateRequest({ body: createDashboardSchema }), requireUser],
  async (req: any, res: any, next: any) => {
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
  }
);

// /** Publish */
// router.post(
//   "/publish/:id",
//   [validateRequest({ params: detailSchema }), requireUser],
//   async (req: any, res: any, next: any) => {
//     try {
//       const user: ParsedToken = req.user;
//       const chartId = req.params.id;
//       const chart = await db.findChartById(chartId);
//       if (!chart) {
//         return res.json({ message: "Not Found" }).status(404);
//       }
//       if (chart.userId !== user.userId) {
//         return res.json({ message: "Not Authorized" }).status(401);
//       }
//       const result = await db.publishChart(chartId, !chart?.publish);
//       return res.json({ published: result.publish });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

/** Delete ID */
router.delete(
  "/:id",
  [validateRequest({ params: detailSchema }), requireUser],
  async (req: any, res: any, next: any) => {
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
  }
);
type TSlot = Prisma.XOR<
  Prisma.SlotCreateWithoutDashboardInput,
  Prisma.SlotUncheckedCreateWithoutDashboardInput
>;

type TUpsert = Prisma.SlotUpsertWithWhereUniqueWithoutDashboardInput;

/** Update slots */
router.put(
  "/:id/slots",
  [
    validateRequest({ body: updateSlotsSchema }),
    validateRequest({ params: detailSchema }),
    requireUser,
  ],
  async (req: any, res: any, next: any) => {
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
      console.log(updateDashboardSchema.shape.slots);
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
  }
);

/** Update ID */
router.put(
  "/:id",
  [
    validateRequest({ body: updateDashboardSchema }),
    validateRequest({ params: detailSchema }),
    requireUser,
  ],
  async (req: any, res: any, next: any) => {
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
      console.log(updateDashboardSchema.shape.slots);
      const result = await db.updateDashboard(dashboardId, dashboardData);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
