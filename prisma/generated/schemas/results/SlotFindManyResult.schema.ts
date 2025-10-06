import * as z from 'zod';
export const SlotFindManyResultSchema = z.object({
  data: z.array(z.object({
  dashboard: z.unknown(),
  dashboardId: z.string(),
  chart: z.unknown(),
  chartId: z.string(),
  settings: z.unknown().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})),
  pagination: z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean()
})
});