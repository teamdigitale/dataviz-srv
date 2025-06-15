import { verifyAccessToken } from "./jwt";
import { ZodError } from "zod";
import type { ErrorResponse, RequestValidators } from "../types";
import type { NextFunction, Response, Request } from "express";
import { logger } from "./logger.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
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
    logger.info('Route not found', {
      method: req.method,
      url: req.originalUrl
    });
  } else if (statusCode >= 500) {
    logger.error(err.message, {
      method: req.method,
      url: req.originalUrl,
      stack: err.stack
    });
  }

  res.json({
    error: {
      message: err.message
    }
  });
}

export function validateRequest(validators: RequestValidators) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (validators.params) {
        req.params = await validators.params.parseAsync(req.params);
      }
      if (validators.body) {
        req.body = await validators.body.parseAsync(req.body);
      }
      if (validators.query) {
        req.query = await validators.query.parseAsync(req.query);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400);
        logger.warn('Validation error', { 
          errors: error.errors,
          url: req.originalUrl,
          method: req.method 
        });
      }
      next(error);
    }
  };
}

export function checkAuthCookie(req: any, res: Response, next: NextFunction) {
  try {
    const accessToken = req.cookies["access_token"] || null;
    if (!accessToken) {
      return next();
    }
    const payload = verifyAccessToken(accessToken) as any;
    req.user = payload;
    logger.debug('User authenticated', { userId: payload.userId });
  } catch (error) {
    logger.warn('Authentication failed', { error: error instanceof Error ? error.message : error });
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
      logger.warn('Unauthorized access attempt', { url: req.originalUrl });
      throw new Error("Unauthorized.");
    }

    next();
  } catch (error) {
    next(error);
  }
}