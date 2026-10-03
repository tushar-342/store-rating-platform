export class AppError extends Error {
  constructor(message, status = 400, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export const ok = (res, data, message = 'Operation successful', status = 200) =>
  res.status(status).json({ success: true, message, data });

export function errorHandler(error, _req, res, _next) {
  void _next;
  if (error?.code === 'P2002')
    return res
      .status(409)
      .json({ success: false, message: 'A record with this value already exists', errors: [] });
  if (error?.code === 'P2025')
    return res.status(404).json({ success: false, message: 'Record not found', errors: [] });
  const status = error.status || (error.name === 'ZodError' ? 422 : 500);
  const errors =
    error.errors ||
    (error.name === 'ZodError'
      ? error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
      : []);
  if (status >= 500) console.error(error);
  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal server error' : error.message,
    errors,
  });
}
