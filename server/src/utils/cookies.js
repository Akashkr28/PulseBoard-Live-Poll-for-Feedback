export const SESSION_COOKIE = "pulseboard_session";
export const CSRF_COOKIE = "pulseboard_csrf";

function useSecureCookies() {
  return (
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    Boolean(process.env.RENDER_EXTERNAL_URL)
  );
}

function baseCookieOptions(httpOnly = true) {
  const secure = useSecureCookies();

  return {
    httpOnly,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/"
  };
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    ...baseCookieOptions(true),
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, baseCookieOptions(true));
}

export function setCsrfCookie(res, token) {
  res.cookie(CSRF_COOKIE, token, {
    ...baseCookieOptions(true),
    maxAge: 2 * 60 * 60 * 1000
  });
}

export function clearCsrfCookie(res) {
  res.clearCookie(CSRF_COOKIE, baseCookieOptions(true));
}
