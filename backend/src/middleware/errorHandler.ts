import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Default error
  const statusCode = 500;
  const message = 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errorCode: 'INTERNAL_SERVER_ERROR',
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    data: null,
    errorCode: 'NOT_FOUND',
  });
};
