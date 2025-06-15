import { verifyAccessToken } from "./jwt";
import { ZodError } from "zod";
import type { ErrorResponse, RequestValidators } from "../types";
import type { NextFunction, Response, Request } from "express";

import { logger } from "./logger.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    // Skip logging per errori che già vengono loggati
    if (res.statusCode >= 400) return;

    const duration = Date.now() - start;
    logger.request(req, res, duration);
  });

  next();
}

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  (error as any).isNotFound = true;
  next(error);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);

  if ((err as any).isNotFound) {
    logger.info("Route not found", {
      method: req.method,
      url: req.originalUrl,
    });
  } else if (statusCode >= 500) {
    logger.error(err.message, {
      method: req.method,
      url: req.originalUrl,
      stack: err.stack,
    });
  }

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
        logger.info(JSON.stringify(req.body, null, 2));
        req.body = await validators.body.parseAsync(req.body);
      }
      if (validators.query) {
        req.query = await validators.query.parseAsync(req.query);
      }
      next();
    } catch (error) {
      logger.info("ERROR VALIDATING REQUEST SCHEMA", error);
      if (error instanceof ZodError) {
        logger.info("ZOD ERROR");
        res.status(400);
        logger.warn("Validation error", {
          errors: error.errors,
          url: req.originalUrl,
          method: req.method,
        });
      }
      next(error);
    }
  };
}

export function checkAuth(req: any, res: Response, next: NextFunction) {
  logger.info("checkAuth");
  let accessToken;
  try {
    logger.info("checkAuthCookie");
    logger.info("Cookies: ", req.cookies);
    accessToken = req.cookies["access_token"];
    if (!accessToken) {
      logger.info("checkAuthBearer");
      logger.info("Bearer: ", req.headers.authorization);
      accessToken = (req.headers.authorization || "").replace(/^Bearer\s/, "");
    }

    if (accessToken) {
      logger.info("ACCESS TOKEN", accessToken);
      const payload = verifyAccessToken(accessToken) as any;
      logger.info("USER", payload);
      req.user = payload;
      req.token = accessToken;
    }
    next();
  } catch (error) {
    console.error("checkAuth ERROR", error);
    req.user = null;
    return res.status(401).json({ error });
  }
}

export function requireUser(req: any, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401);
      throw new Error("Unauthorized.");
    }
    logger.info("user is ok");

    next();
  } catch (error) {
    next(error);
  }
}
