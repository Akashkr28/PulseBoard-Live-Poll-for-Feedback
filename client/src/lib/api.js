export const API_URL = import.meta.env.VITE_API_URL || "/api";
let csrfToken = "";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const method = options.method || "GET";
  const usesCsrf = !["GET", "HEAD"].includes(method.toUpperCase());

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (usesCsrf) {
    csrfToken = csrfToken || (await fetchCsrfToken());
    headers.set("X-CSRF-Token", csrfToken);
  }

  let response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body
  });

  if (response.status === 403 && usesCsrf && !options.retryingCsrf) {
    csrfToken = await fetchCsrfToken();
    headers.set("X-CSRF-Token", csrfToken);
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body:
        options.body && !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : options.body
    });
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : {};

  if (!response.ok) {
    const fallback =
      response.status >= 500
        ? "API server is unavailable. Start the backend and MongoDB, then try again."
        : "Request failed.";
    throw new ApiError(
      payload.message || fallback,
      response.status,
      payload.details
    );
  }

  return payload;
}

async function fetchCsrfToken() {
  const response = await fetch(`${API_URL}/auth/csrf`, {
    credentials: "include"
  });
  const payload = await response.json();

  if (!response.ok || !payload.csrfToken) {
    throw new ApiError("Could not start a secure session.", response.status);
  }

  return payload.csrfToken;
}

export function clearCsrfToken() {
  csrfToken = "";
}

export function publicPollLink(publicId) {
  return `${window.location.origin}/p/${publicId}`;
}
