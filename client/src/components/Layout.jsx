import { BarChart3, LogOut, Plus, RadioTower, UserCircle2 } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to={user ? "/dashboard" : "/login"}>
          <span className="brand-mark">
            <RadioTower size={20} />
          </span>
          <span>PulseBoard</span>
        </Link>

        <nav className="nav-actions" aria-label="Primary navigation">
          {user ? (
            <>
              <NavLink to="/dashboard" className="nav-link">
                <BarChart3 size={18} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/polls/new" className="button button-small">
                <Plus size={17} />
                <span>New poll</span>
              </NavLink>
              <span className="user-chip">
                <UserCircle2 size={17} />
                {user.name?.split(" ")[0] || "Creator"}
              </span>
              <button className="icon-button" type="button" onClick={handleLogout}>
                <LogOut size={18} />
                <span className="sr-only">Log out</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                Sign in
              </NavLink>
              <NavLink to="/register" className="button button-small">
                Create account
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="page-frame">{children}</main>
    </div>
  );
}
