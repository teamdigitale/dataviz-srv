import { Router } from "express";
import * as z from "zod";
import * as ai from "../lib/ai";

import { requireUser, validateRequest } from "../lib/middlewares";
import type { ParsedToken } from "../types";

const router = Router();

// const getSuggestionsSchema = z.object({
//   data: z.unknown(),
// });

/** Create */
router.post(
  "/",
  [/*validateRequest({ body: getSuggestionsSchema }),*/ requireUser],
  async (req: any, res: any, next: any) => {
    console.log("hints");
    try {
      const user: ParsedToken = req.user;
      console.log("user", user);
      const { body } = req;
      console.log("body", body);

      const results = await ai.getSuggestions(body);
      console.log("results", results);
      return res.json(results);
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
);

export default router;
