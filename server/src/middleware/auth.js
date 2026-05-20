import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { SESSION_COOKIE } from "../utils/cookies.js";
import { asyncHandler, httpError } from "../utils/http.js";

function getToken(req) {
  return req.cookies?.[SESSION_COOKIE] || null;
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = getToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw httpError(401, "Your session is no longer valid.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.status) throw error;
    throw httpError(401, "Please sign in again.");
  }
});

export const requireAuth = [
  optionalAuth,
  (req, _res, next) => {
    if (!req.user) {
      next(httpError(401, "Authentication is required."));
      return;
    }

    next();
  }
];
