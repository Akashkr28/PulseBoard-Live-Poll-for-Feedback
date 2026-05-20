import rateLimit from "express-rate-limit";

function jsonLimitMessage(message) {
  return {
    message
  };
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonLimitMessage("Too many requests. Please slow down and try again.")
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonLimitMessage("Too many sign-in attempts. Please try again later.")
});

export const responseLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonLimitMessage("Too many poll submissions from this network. Please wait a bit.")
});
