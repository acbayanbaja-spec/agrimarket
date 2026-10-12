import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error & { statusCode?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const errorCode =
    error.code ||
    (statusCode === 503 ? 'DATABASE_UNAVAILABLE' : 'INTERNAL_SERVER_ERROR');
  const message =
    statusCode === 500
      ? 'Internal server error'
      : error.message || 'Request failed';

  if (statusCode >= 500) {
    console.error('Error:', error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errorCode,
    requestId: (_req as Request & { requestId?: string }).requestId,
  });
};

export const notFoundHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    data: null,
    errorCode: 'NOT_FOUND',
  });
};
