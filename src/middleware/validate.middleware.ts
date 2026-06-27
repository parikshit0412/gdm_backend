import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues: ZodIssue[] = err.issues ?? (err as ZodError & { errors?: ZodIssue[] }).errors ?? [];
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: issues.map((e: ZodIssue) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
