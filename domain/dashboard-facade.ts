import dashboardRepository from "../repository/dashboard-repository";
import type { ParsedToken } from "../types";

//#region query
const findAll = async (req: any, res: any, next: any) => {
  try {
    const user: ParsedToken = req.user;
    const id = user.userId;
    const results = await dashboardRepository.findByUserId(id);
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
    const result = await dashboardRepository.findByIdWithIncludes(id);
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
    const result = await dashboardRepository.create(chartData);

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
    const dashboard = await dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      return res.json({ message: "Not Found" }).status(404);
    }
    if (dashboard.userId !== user.userId) {
      return res.json({ message: "Not Authorized" }).status(401);
    }
    console.log("Updating dashboard", dashboardId);
    const dashboardData = req.body;
    console.log("Dashboard Data", dashboardData);
    const result = await dashboardRepository.update(dashboardId, dashboardData);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};
const deleteById = async (req: any, res: any, next: any) => {
  try {
    const user: ParsedToken = req.user;
    const dashboardId = req.params.id;
    const dashboard = await dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      return res.json({ message: "Not Found" }).status(404);
    }
    if (dashboard.userId !== user.userId) {
      return res.json({ message: "Not Authorized" }).status(401);
    }
    const result = await dashboardRepository.deleteById(dashboardId);
    return res.status(204).json();
  } catch (err) {
    next(err);
  }
};
//#endregion

//#region slots

function separateCreateAndUpdate<T>(
  storedSlots: Array<T>,
  updatedSlots: Array<T>,
  identityFn: (item: T) => string
): { toCreate: Array<T>; toUpdate: Array<T> } {
  const storedMap = new Map(
    storedSlots.map((slot) => [identityFn(slot), slot])
  );

  const toCreate: Array<T> = [];
  const toUpdate: Array<T> = [];

  for (const slot of updatedSlots) {
    if (storedMap.has(identityFn(slot))) {
      toUpdate.push(slot); // Exists in stored → Needs update
    } else {
      toCreate.push(slot); // New slot → Needs creation
    }
  }

  return { toCreate, toUpdate };
}

function separateCreateUpdateDelete<T>(
  storedSlots: Array<T>,
  updatedSlots: Array<T>,
  identityFn: (item: T) => string
): { toCreate: Array<T>; toUpdate: Array<T>; toDelete: Array<T> } {
  const storedMap = new Map(
    storedSlots.map((slot) => [identityFn(slot), slot])
  );
  const updatedMap = new Map(
    updatedSlots.map((slot) => [identityFn(slot), slot])
  );

  const toCreate: Array<T> = [];
  const toUpdate: Array<T> = [];
  const toDelete: Array<T> = [];

  for (const slot of updatedSlots) {
    if (storedMap.has(identityFn(slot))) {
      toUpdate.push(slot); // Exists in both → Needs update
    } else {
      toCreate.push(slot); // Only in updatedSlots → Needs creation
    }
  }

  for (const slot of storedSlots) {
    if (!updatedMap.has(identityFn(slot))) {
      toDelete.push(slot); // Only in storedSlots → Needs deletion
    }
  }

  return { toCreate, toUpdate, toDelete };
}

const updateSlots = async (req: any, res: any, next: any) => {
  try {
    const user: ParsedToken = req.user;
    const dashboardId = req.params.id;
    const dashboard = await dashboardRepository.findSlots(dashboardId);
    if (!dashboard) {
      return res.json({ message: "Not Found" }).status(404);
    }
    if (dashboard.userId !== user.userId) {
      return res.json({ message: "Not Authorized" }).status(401);
    }
    console.log("Updating dashboard", dashboardId);
    console.log("Updating dashboard", JSON.stringify(dashboard));
    const dashboardData = req.body;
    console.log("Dashboard Data", dashboardData);
    const { slots: storedSlots } = dashboard;
    const { slots: updatedSlots } = dashboardData;
    const { toCreate, toUpdate, toDelete } = separateCreateUpdateDelete(
      storedSlots,
      updatedSlots,
      (s) => s.chartId
    );

    console.log(toCreate, toUpdate);

    const result = await dashboardRepository.updateSlots(dashboardId, {
      toCreate,
      toUpdate,
      toDelete,
    });
    return res.json(result);
  } catch (err) {
    next(err);
  }
};
//#endregion

export default { findAll, findById, create, update, deleteById, updateSlots };
