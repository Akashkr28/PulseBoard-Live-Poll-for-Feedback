import crypto from "crypto";
import { CSRF_COOKIE, setCsrfCookie } from "../utils/cookies.js";
import { httpError } from "../utils/http.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function tokenMatches(cookieToken, headerToken) {
  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}

export function createCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function issueCsrfToken(_req, res) {
  const csrfToken = createCsrfToken();
  setCsrfCookie(res, csrfToken);
  res.json({ csrfToken });
}

export function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = String(req.headers["x-csrf-token"] || "");

  if (!tokenMatches(cookieToken, headerToken)) {
    next(httpError(403, "CSRF token is missing or invalid."));
    return;
  }

  next();
}
