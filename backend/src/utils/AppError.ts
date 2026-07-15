/**
 * Operational error carrying an HTTP status + client-safe message.
 * The terminal error handler renders it as `{ message }` (matches the frontend client).
 */
export class AppError extends Error {
  readonly status: number;
  readonly expose: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.expose = true;
  }

  static badRequest(message = 'Bad request') {
    return new AppError(400, message);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, message);
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(403, message);
  }
  static notFound(message = 'Not found') {
    return new AppError(404, message);
  }
  static conflict(message = 'Conflict') {
    return new AppError(409, message);
  }
}
