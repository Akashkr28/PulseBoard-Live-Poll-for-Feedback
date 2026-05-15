import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Github,
  Link as LinkIcon,
  LockKeyhole,
  Mail,
  RadioTower,
  Sparkles,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

const features = [
  {
    icon: LinkIcon,
    title: "Shareable poll links",
    copy: "Create a poll once and send a clean public link to any audience.",
    meta: "Public URL",
    preview: "pulseboard.app/p/retro-42",
    points: ["Expiry ready", "Mobile friendly", "Same link for results"]
  },
  {
    icon: LockKeyhole,
    title: "Anonymous or signed",
    copy: "Choose the right identity mode for quick feedback or accountable responses.",
    meta: "Access mode",
    preview: "Anonymous / Signed-in",
    points: ["One response per user", "Private by default", "Creator controlled"]
  },
  {
    icon: BarChart3,
    title: "Live result analytics",
    copy: "Watch totals, option counts and summaries update while responses arrive.",
    meta: "Live dashboard",
    preview: "248 responses",
    points: ["Option counts", "Completion rate", "Publish final outcome"]
  }
];

const workflow = [
  {
    title: "Create",
    copy: "Build focused single-choice questions with required and optional fields.",
    stat: "3 min",
    bars: [44, 72, 58]
  },
  {
    title: "Share",
    copy: "Send one public link and let the poll window close itself on time.",
    stat: "1 link",
    bars: [64, 42, 86]
  },
  {
    title: "Collect",
    copy: "Capture anonymous or authenticated responses as counts update live.",
    stat: "Live",
    bars: [52, 78, 95]
  },
  {
    title: "Publish",
    copy: "Turn the same poll URL into a public outcome summary when ready.",
    stat: "Final",
    bars: [86, 66, 48]
  }
];

const footerLinks = ["Dashboard", "Create poll", "Sign in"];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <motion.section
      className="landing-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <section className="brand-stage">
        <div className="brand-stage-orbit" aria-hidden="true">
          <span>Live</span>
          <span>Polls</span>
          <span>Feedback</span>
        </div>
        <motion.div
          className="brand-stage-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <span className="eyebrow">Introducing</span>
          <h1 className="brand-stage-word" aria-label="PulseBoard">
            {"PulseBoard".split("").map((letter, index) => (
              <motion.span
                key={`${letter}-${index}`}
                initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.45,
                  ease: "easeOut",
                  delay: index * 0.045
                }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>
          <p>Live polls for feedback, decisions and transparent outcomes.</p>
        </motion.div>
      </section>

      <section className="landing-hero">
        <div className="landing-scene" aria-hidden="true">
          <div className="scene-card scene-card-main">
            <div className="scene-card-head">
              <span />
              <span />
              <span />
            </div>
            <div className="scene-card-body">
              <div>
                <span>Live responses</span>
                <strong>1,284</strong>
              </div>
              <div className="scene-bars">
                <span style={{ height: "58%" }} />
                <span style={{ height: "82%" }} />
                <span style={{ height: "44%" }} />
                <span style={{ height: "92%" }} />
                <span style={{ height: "70%" }} />
              </div>
            </div>
          </div>
          <div className="scene-card scene-card-small scene-card-left">
            <CheckCircle2 size={22} />
            <span>Published outcome</span>
            <strong>Ready</strong>
          </div>
          <div className="scene-card scene-card-small scene-card-right">
            <Users size={22} />
            <span>Participation</span>
            <strong>91%</strong>
          </div>
          <div className="scene-signal scene-signal-one" />
          <div className="scene-signal scene-signal-two" />
        </div>

        <div className="landing-hero-content">
          <span className="eyebrow">PulseBoard for feedback loops</span>
          <h1>Launch live polls that feel fast, focused and decision-ready.</h1>
          <p>
            Create single-choice polls, share them publicly, collect anonymous
            or authenticated responses, and publish final results from the same link.
          </p>

          <div className="landing-actions">
            <Link className="button" to={user ? "/dashboard" : "/login"}>
              <span>{user ? "Open dashboard" : "Sign in"}</span>
              <ArrowRight size={18} />
            </Link>
            {!user && (
              <Link className="button button-secondary" to="/register">
                Create account
              </Link>
            )}
          </div>

          <div className="landing-proof" aria-label="Platform capabilities">
            <span>
              <RadioTower size={16} />
              Live updates
            </span>
            <span>
              <Clock3 size={16} />
              Expiring links
            </span>
            <span>
              <Sparkles size={16} />
              Public outcomes
            </span>
          </div>
        </div>

        <div className="landing-next-peek" aria-hidden="true">
          <span>Next</span>
          <strong>Creator workflow highlights</strong>
        </div>
      </section>

      <section className="landing-workflow">
        <div className="landing-section-head">
          <span className="eyebrow">A cleaner product rhythm</span>
          <h2>Move from question to published result without losing momentum.</h2>
        </div>
        <div className="workflow-rail" aria-label="PulseBoard workflow">
          {workflow.map((item, index) => (
            <article className="workflow-step" key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div className="workflow-mini" aria-hidden="true">
                {item.bars.map((height, barIndex) => (
                  <i key={barIndex} style={{ height: `${height}%` }} />
                ))}
              </div>
              <div className="workflow-step-copy">
                <strong>{item.title}</strong>
                <p>{item.copy}</p>
              </div>
              <em>{item.stat}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <span className="eyebrow">Creator toolkit</span>
          <h2>Everything a poll creator needs after the link goes out.</h2>
        </div>
        <div className="landing-feature-grid landing-bento">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="landing-feature" key={feature.title}>
                <div className="feature-topline">
                  <Icon size={24} />
                  <span>{feature.meta}</span>
                </div>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                </div>
                {feature.title === "Shareable poll links" && (
                  <div className="feature-link-demo" aria-hidden="true">
                    <div className="demo-url-row">
                      <span>{feature.preview}</span>
                      <strong>Copy</strong>
                    </div>
                    <div className="demo-flow">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="demo-avatars">
                      <span />
                      <span />
                      <span />
                      <em>+42</em>
                    </div>
                  </div>
                )}
                <div className="feature-preview">
                  <strong>{feature.preview}</strong>
                  <div>
                    {feature.points.map((point) => (
                      <span key={point}>{point}</span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-strip">
        <div>
          <span className="eyebrow">Ready when you are</span>
          <h2>Start with a poll, end with a clear result summary.</h2>
        </div>
        <Link className="button" to={user ? "/polls/new" : "/register"}>
          <span>{user ? "Create a poll" : "Get started"}</span>
          <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="footer-brand">
          <span className="brand-mark">
            <RadioTower size={20} />
          </span>
          <div>
            <strong>PulseBoard</strong>
            <p>Live polls for feedback loops that end in clearer decisions.</p>
          </div>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          {footerLinks.map((item) => {
            const href =
              item === "Dashboard" ? "/dashboard" : item === "Create poll" ? "/polls/new" : "/login";
            return (
              <Link key={item} to={href}>
                {item}
              </Link>
            );
          })}
        </nav>

        <div className="footer-actions">
          <a href="mailto:hello@pulseboard.dev" aria-label="Email PulseBoard">
            <Mail size={18} />
          </a>
          <a href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub">
            <Github size={18} />
          </a>
        </div>
      </footer>
    </motion.section>
  );
}
