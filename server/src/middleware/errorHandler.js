import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `No route for ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong.';

  // Turn Mongoose noise into something a user can read.
  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `"${err.value}" is not a valid ${err.path}.`;
  } else if (err.code === 11000) {
    status = 409;
    message = `That ${Object.keys(err.keyValue)[0]} is already taken.`;
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
}
