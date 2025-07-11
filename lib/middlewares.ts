import { verifyAccessToken } from "./jwt";
import { ZodError } from "zod";
import type { ErrorResponse, RequestValidators } from "../types";
import type { NextFunction, Response, Request } from "express";

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
    },
  });
}

export function validateRequest(validators: RequestValidators) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (validators.params) {
        req.params = await validators.params.parseAsync(req.params);
      }
      if (validators.body) {
        console.log(JSON.stringify(req.body, null, 2));
        req.body = await validators.body.parseAsync(req.body);
      }
      if (validators.query) {
        req.query = await validators.query.parseAsync(req.query);
      }
      next();
    } catch (error) {
      console.log("ERROR VALIDATING REQUEST SCHEMA", error);
      if (error instanceof ZodError) {
        console.log("ZOD ERROR");
        res.status(400);
      }
      next(error);
    }
  };
}

export function checkAuthCookie(req: any, res: Response, next: NextFunction) {
  console.log("checkAuthCookie");
  console.log("Cookies: ", req.cookies);
  try {
    const accessToken = req.cookies["access_token"] || null;
    // console.log("ACCESS TOKEN", accessToken);
    if (!accessToken) {
      return;
    }
    const payload = verifyAccessToken(accessToken) as any;
    console.log("checkAuthCookie user", payload);
    req.user = payload;
  } catch (error) {
    console.log("checkAuthCookie ERROR", error);
    req.user = null;
  } finally {
    next();
  }
}

export function deserializeUser(req: any, res: Response, next: NextFunction) {
  try {
    const accessToken = (req.headers.authorization || "").replace(
      /^Bearer\s/,
      ""
    );
    if (!accessToken) {
      return next();
    }
    const payload = verifyAccessToken(accessToken) as any;
    req.user = payload;

    next();
  } catch (error) {
    next();
  }
}

export function requireUser(req: any, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401);
      throw new Error("Unauthorized.");
    }
    console.log("user is ok");

    next();
  } catch (error) {
    next(error);
  }
}
