import { Router } from "express";
import * as db from "../lib/db";
// import * as z from "zod";
import { requireUser } from "../lib/middlewares";
import type { ParsedToken } from "../types";
const router = Router();

router.get("/", requireUser, async (req: any, res, next) => {
  try {
    const user: ParsedToken = req.user;

    console.log(user);
    const id = user.userId;

    const userDb = await db.findUserById(id);
    console.log(userDb);

    const { data } = req.body;
    const result = await db.findChartByUSerId(id);
    res.json({
      result,
    });

    return res.json({ user, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireUser, async (req: any, res, next) => {
  try {
    const user: ParsedToken = req.user;
    const { data } = req.body;
    // const result = await db.createChart(user.userId, data);
    // res.json({
    //   result,
    // });

    return res.json({ user, data });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireUser, async (req: any, res, next) => {
  try {
    const id = req.params.id;
    const user: ParsedToken = req.user;
    const { data } = req.body;
    const result = await db.findChartById(id);
    res.json({
      result,
    });

    return res.json({ user, data });
  } catch (err) {
    next(err);
  }
});

export default router;
