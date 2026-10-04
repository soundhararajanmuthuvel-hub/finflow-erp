import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Operation successful',
  statusCode = 200,
  meta?: ApiResponse['meta']
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message = 'An error occurred',
  statusCode = 400,
  errors?: any
) => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};
