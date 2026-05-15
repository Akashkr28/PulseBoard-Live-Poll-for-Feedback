export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;

  if (error.code === 11000) {
    res.status(409).json({ message: "That record already exists." });
    return;
  }

  res.status(status).json({
    message: error.message || "Something went wrong.",
    details: error.details || undefined
  });
}
