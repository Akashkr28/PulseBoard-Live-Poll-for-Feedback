import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContextValue.js";
import { request } from "../lib/api.js";

const TOKEN_KEY = "pulseboard_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!token) {
        setBooting(false);
        return;
      }

      try {
        const data = await request("/auth/me", { token });
        if (!cancelled) setUser(data.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setToken(null);
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
  }, [token]);

  async function login(values) {
    const data = await request("/auth/login", {
      method: "POST",
      body: values
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(values) {
    const data = await request("/auth/register", {
      method: "POST",
      body: values
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      booting,
      login,
      register,
      logout
    }),
    [user, token, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
