import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContextValue.js";
import { clearCsrfToken, request } from "../lib/api.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const data = await request("/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(values) {
    const data = await request("/auth/login", {
      method: "POST",
      body: values
    });
    setUser(data.user);
    return data.user;
  }

  async function register(values) {
    const data = await request("/auth/register", {
      method: "POST",
      body: values
    });
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      clearCsrfToken();
    }

    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      booting,
      login,
      register,
      logout
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
