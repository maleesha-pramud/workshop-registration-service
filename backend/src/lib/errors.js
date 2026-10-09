// Domain errors. Services throw these; the error handler maps them to HTTP.
// `code` is a stable machine-readable identifier the frontend can branch on.

export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Some fields are invalid', details) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Please sign in to continue', code = 'UNAUTHORIZED') {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to do that') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(code, message, details) {
    super(409, code, message, details);
  }
}

export class ServiceBusyError extends AppError {
  constructor(message = 'The system is busy right now. Please try again.') {
    super(503, 'SERVICE_BUSY', message);
  }
}
