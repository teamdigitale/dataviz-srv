import * as db from "../lib/db";
import type { ParsedToken } from "../types";

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

export default { findAll, findById };
