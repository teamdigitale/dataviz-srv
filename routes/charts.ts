import { Router } from "express";
import * as db from "../lib/db";
import * as z from "zod";
import { requireUser } from "../lib/middlewares";
import type { ParsedToken } from "../types";
import { validateRequest } from "../lib/middlewares";
import { convertToObject } from "typescript";

const router = Router();

const detailSchema = z.object({
  id: z.string({
    required_error: "Id is required",
  }),
});

const createChartSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  chart: z.string({
    required_error: "Chart type is required",
  }),
  config: z.unknown().optional(),
  data: z.unknown().optional(),
  publish: z.boolean().optional(),
});

// INDEX
router.get("/", requireUser, async (req: any, res, next) => {
  try {
    const user: ParsedToken = req.user;
    const id = user.userId;
    const results = await db.findChartsByUSerId(id);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET
router.get(
  "/:id",
  [validateRequest({ params: detailSchema }), requireUser],
  async (req: any, res: any, next: any) => {
    try {
      const id = req.params.id;
      const user: ParsedToken = req.user;
      const { data } = req.body;
      const result = await db.findChartById(id);
      res.json(result);
      return res.json({ user, data });
    } catch (err) {
      next(err);
    }
  }
);

// SHOW
router.get(
  "/show/:id",
  validateRequest({ params: detailSchema }),
  async (req: any, res, next) => {
    try {
      const id = req.params.id;
      const result = await db.findChartById(id);
      if (result?.publish !== true) {
        return res.json({ message: "Not Published" }).status(401);
      }
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  [validateRequest({ body: createChartSchema }), requireUser],
  async (req: any, res: any, next: any) => {
    try {
      const user: ParsedToken = req.user;
      const { body } = req;
      const chartData = {
        userId: user.userId,
        ...body,
      };
      console.log(chartData);
      const result = await db.createChart(chartData);

      return res.json(result);
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
);

// PUBLISH
router.post(
  "/publish/:id",
  [validateRequest({ params: detailSchema }), requireUser],
  async (req: any, res: any, next: any) => {
    try {
      const user: ParsedToken = req.user;
      const chartId = req.params.id;
      const chart = await db.findChartById(chartId);
      if (!chart) {
        return res.json({ message: "Not Found" }).status(404);
      }
      if (chart.userId !== user.userId) {
        return res.json({ message: "Not Authorized" }).status(401);
      }
      const result = await db.publishChart(chartId, !chart?.publish);
      return res.json({ published: result.publish });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE
router.delete(
  "/:id",
  [validateRequest({ params: detailSchema }), requireUser],
  async (req: any, res: any, next: any) => {
    try {
      const user: ParsedToken = req.user;
      const chartId = req.params.id;
      const chart = await db.findChartById(chartId);
      if (!chart) {
        return res.json({ message: "Not Found" }).status(404);
      }
      if (chart.userId !== user.userId) {
        return res.json({ message: "Not Authorized" }).status(401);
      }
      const result = await db.deleteChart(chartId);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE
router.put(
  "/:id",
  [validateRequest({ params: detailSchema }), requireUser],
  async (req: any, res: any, next: any) => {
    try {
      const user: ParsedToken = req.user;
      const chartId = req.params.id;
      const chart = await db.findChartById(chartId);
      if (!chart) {
        return res.json({ message: "Not Found" }).status(404);
      }
      if (chart.userId !== user.userId) {
        return res.json({ message: "Not Authorized" }).status(401);
      }
      const { data } = req.body;
      const result = await db.updateChart(chartId, data);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
