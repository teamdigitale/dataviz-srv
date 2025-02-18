import { Router } from "express";
import * as z from "zod";
import facade from "../domain/dashboard-facade";
import { requireUser, validateRequest } from "../lib/middlewares";

const router = Router();

const detailSchema = z.object({
  id: z.string({
    required_error: "Id is required",
  }),
});

const slotSchema = z.object({
  chartId: z.string(), // Ignoriamo la validazione specifica per Chart
  settings: z.object({}).passthrough().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

const createDashboardSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
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
  facade.create
);

/** Delete ID */
router.delete(
  "/:id",
  [validateRequest({ params: detailSchema }), requireUser],
  facade.deleteById
);

/** Update slots */
router.put(
  "/:id/slots",
  [
    validateRequest({ body: updateSlotsSchema }),
    validateRequest({ params: detailSchema }),
    requireUser,
  ],
  facade.updateSlots
);

/** Update ID */
router.put(
  "/:id",
  [
    validateRequest({ body: updateDashboardSchema }),
    validateRequest({ params: detailSchema }),
    requireUser,
  ],
  facade.update
);

export default router;
