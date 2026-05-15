import { Activity, BarChart3, KeyRound, Mail, RadioTower, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (isRegister) {
        await register(values);
      } else {
        await login({ email: values.email, password: values.password });
      }
      navigate(location.state?.from?.pathname || "/dashboard");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.section
      className="auth-layout"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="auth-copy">
        <span className="eyebrow">Live feedback workspace</span>
        <h1>{isRegister ? "Create polls people want to finish." : "Welcome back."}</h1>
        <p>
          Launch focused polls, collect feedback from any audience, and watch
          participation move in real time.
        </p>
        <div className="auth-proof-row" aria-label="Platform highlights">
          <span>
            <RadioTower size={16} />
            Live counts
          </span>
          <span>
            <BarChart3 size={16} />
            Clear summaries
          </span>
          <span>
            <Activity size={16} />
            Publish-ready
          </span>
        </div>
        <div className="auth-showcase" aria-hidden="true">
          <div className="showcase-toolbar">
            <span />
            <span />
            <span />
          </div>
          <div className="showcase-grid">
            <div className="showcase-panel showcase-panel-main">
              <div>
                <span>Responses</span>
                <strong>248</strong>
              </div>
              <div className="showcase-bars">
                <span style={{ height: "42%" }} />
                <span style={{ height: "64%" }} />
                <span style={{ height: "36%" }} />
                <span style={{ height: "82%" }} />
                <span style={{ height: "58%" }} />
              </div>
            </div>
            <div className="showcase-panel">
              <span>Top choice</span>
              <strong>Option B</strong>
            </div>
            <div className="showcase-panel">
              <span>Completion</span>
              <strong>91%</strong>
            </div>
          </div>
        </div>
      </div>

      <motion.form
        className="panel auth-panel"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: "easeOut", delay: 0.08 }}
      >
        <div className="form-head">
          <h2>{isRegister ? "Create your account" : "Sign in"}</h2>
          <p>
            {isRegister
              ? "Start a workspace for polls and feedback."
              : "Open your polls and analytics dashboard."}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {isRegister && (
          <label className="field">
            <span>Name</span>
            <div className="input-with-icon">
              <UserRound size={18} />
              <input
                name="name"
                value={values.name}
                onChange={updateField}
                placeholder="Aarav Sharma"
                required
              />
            </div>
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={updateField}
              placeholder="you@example.com"
              required
            />
          </div>
        </label>

        <label className="field">
          <span>Password</span>
          <div className="input-with-icon">
            <KeyRound size={18} />
            <input
              type="password"
              name="password"
              value={values.password}
              onChange={updateField}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>
        </label>

        <button className="button button-wide" disabled={saving}>
          {saving ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
        </button>

        <p className="switch-copy">
          {isRegister ? "Already have an account?" : "New to PulseBoard?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Sign in" : "Create account"}
          </Link>
        </p>
      </motion.form>
    </motion.section>
  );
}
