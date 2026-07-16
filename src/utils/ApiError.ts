export class ApiError extends Error {
  public statusCode: number;
  public errors: unknown[];

  constructor(
    statusCode: number,
    message: string,
    errors: unknown[] = [],
    stack?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(msg: string): ApiError {
    return new ApiError(400, msg);
  }

  static unauthorized(msg = 'Unauthorized'): ApiError {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden'): ApiError {
    return new ApiError(403, msg);
  }

  static notFound(msg: string): ApiError {
    return new ApiError(404, msg);
  }

  static conflict(msg: string): ApiError {
    return new ApiError(409, msg);
  }

  static internal(msg = 'Internal server error'): ApiError {
    return new ApiError(500, msg);
  }
}
