import {
  BarChart3,
  Clipboard,
  Clock3,
  Pencil,
  LayoutDashboard,
  Plus,
  RadioTower,
  Send,
  Trash2,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusPill from "../components/StatusPill.jsx";
import { useAuth } from "../context/useAuth.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { formatDate } from "../lib/dates.js";
import { publicPollLink, request } from "../lib/api.js";

export default function DashboardPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const stats = useMemo(() => {
    const totalResponses = polls.reduce((sum, poll) => sum + poll.responseCount, 0);
    const live = polls.filter((poll) => poll.active && !poll.isPublished).length;
    const published = polls.filter((poll) => poll.isPublished).length;

    return {
      total: polls.length,
      live,
      published,
      totalResponses
    };
  }, [polls]);

  const visiblePolls = useMemo(() => {
    if (filter === "live") return polls.filter((poll) => poll.active && !poll.isPublished);
    if (filter === "published") return polls.filter((poll) => poll.isPublished);
    if (filter === "closed") return polls.filter((poll) => !poll.active && !poll.isPublished);
    return polls;
  }, [filter, polls]);

  useEffect(() => {
    let active = true;

    async function loadPolls() {
      try {
        const data = await request("/polls");
        if (active) setPolls(data.polls);
      } catch (apiError) {
        if (active) setError(apiError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPolls();
    return () => {
      active = false;
    };
  }, []);

  async function copyLink(publicId) {
    await copyToClipboard(publicPollLink(publicId));
    setCopiedId(publicId);
    window.setTimeout(() => setCopiedId(""), 1600);
  }

  async function deletePoll(pollId) {
    setDeletingId(pollId);
    setError("");

    try {
      await request(`/polls/${pollId}`, {
        method: "DELETE"
      });
      setPolls((currentPolls) => currentPolls.filter((poll) => poll.id !== pollId));
      setConfirmingDeleteId("");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <motion.section
      className="stack"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="page-title-row dashboard-hero">
        <div>
          <span className="eyebrow">Creator dashboard</span>
          <h1>Good to see you, {user?.name?.split(" ")[0] || "there"}.</h1>
          <p>Track live links, response momentum, and final publishing status from one calm workspace.</p>
        </div>
        <Link className="button" to="/polls/new">
          <Plus size={18} />
          <span>Create poll</span>
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="skeleton-grid">
          <span />
          <span />
          <span />
        </div>
      ) : polls.length === 0 ? (
        <div className="panel empty-state">
          <RadioTower size={34} />
          <h2>No polls yet</h2>
          <p>Create your first poll and share the public link with respondents.</p>
          <Link className="button" to="/polls/new">
            <Plus size={18} />
            <span>Create poll</span>
          </Link>
        </div>
      ) : (
        <>
          <section className="overview-grid" aria-label="Workspace overview">
            <article className="overview-card">
              <LayoutDashboard size={20} />
              <span>Total polls</span>
              <strong>{stats.total}</strong>
            </article>
            <article className="overview-card">
              <RadioTower size={20} />
              <span>Live now</span>
              <strong>{stats.live}</strong>
            </article>
            <article className="overview-card">
              <Send size={20} />
              <span>Published</span>
              <strong>{stats.published}</strong>
            </article>
            <article className="overview-card">
              <Users size={20} />
              <span>Responses</span>
              <strong>{stats.totalResponses}</strong>
            </article>
          </section>

          <section className="toolbar-row">
            <div className="filter-tabs" aria-label="Poll filters">
              {["all", "live", "published", "closed"].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={filter === item ? "active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <span>{visiblePolls.length} shown</span>
          </section>

          <div className="poll-grid">
          {visiblePolls.map((poll, index) => (
            <motion.article
              className="poll-card"
              key={poll.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut", delay: index * 0.035 }}
            >
              <div className="poll-card-head">
                <StatusPill poll={poll} />
                <span>{poll.responseMode}</span>
              </div>
              <h2>{poll.title}</h2>
              {poll.description && <p>{poll.description}</p>}
              <dl className="poll-meta">
                <div>
                  <dt>Responses</dt>
                  <dd>{poll.responseCount}</dd>
                </div>
                <div>
                  <dt>Questions</dt>
                  <dd>{poll.questionCount}</dd>
                </div>
                <div>
                  <dt>Expires</dt>
                  <dd className="meta-date">
                    <Clock3 size={14} />
                    {formatDate(poll.expiresAt)}
                  </dd>
                </div>
              </dl>
              <div className="card-actions">
                <Link className="button button-secondary" to={`/polls/${poll.id}/analytics`}>
                  <BarChart3 size={17} />
                  <span>Analytics</span>
                </Link>
                {!poll.isPublished && (
                  <Link className="button button-secondary" to={`/polls/${poll.id}/edit`}>
                    <Pencil size={17} />
                    <span>Edit</span>
                  </Link>
                )}
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => copyLink(poll.publicId)}
                >
                  <Clipboard size={17} />
                  <span>{copiedId === poll.publicId ? "Copied" : "Copy link"}</span>
                </button>
                <button
                  className="button button-danger"
                  type="button"
                  onClick={() => setConfirmingDeleteId(poll.id)}
                  disabled={deletingId === poll.id}
                >
                  <Trash2 size={17} />
                  <span>Delete</span>
                </button>
              </div>
              {confirmingDeleteId === poll.id && (
                <div className="delete-confirm" role="group" aria-label={`Delete ${poll.title}`}>
                  <span>Delete this poll and its responses?</span>
                  <div>
                    <button
                      className="button button-quiet"
                      type="button"
                      onClick={() => setConfirmingDeleteId("")}
                      disabled={deletingId === poll.id}
                    >
                      Cancel
                    </button>
                    <button
                      className="button button-danger"
                      type="button"
                      onClick={() => deletePoll(poll.id)}
                      disabled={deletingId === poll.id}
                    >
                      <Trash2 size={16} />
                      <span>{deletingId === poll.id ? "Deleting..." : "Delete poll"}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.article>
          ))}
          </div>
        </>
      )}
    </motion.section>
  );
}
