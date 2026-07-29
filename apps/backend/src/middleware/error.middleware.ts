import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.path}`, 404, "NOT_FOUND"));
}

export function errorMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: { message: "Validation failed", code: "VALIDATION_ERROR", details: error.issues } });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: { message: error.message, code: error.code } });
  }

  logger.error("Unhandled error", { error });
  return res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL_ERROR" } });
}
