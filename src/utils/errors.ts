export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const assertExists = <T>(value: T | undefined | null, message: string): T => {
  if (value === undefined || value === null) {
    throw new AppError(message, 404);
  }
  return value;
};

