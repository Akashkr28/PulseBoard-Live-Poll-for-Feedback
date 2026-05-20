import { ArrowLeft, Clipboard, ExternalLink, Pencil, RadioTower, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ResultSummary from "../components/ResultSummary.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { copyToClipboard } from "../lib/clipboard.js";
import { formatDate } from "../lib/dates.js";
import { publicPollLink, request } from "../lib/api.js";
import { createDebouncedHandler, createSocket } from "../lib/socket.js";

export default function AnalyticsPage() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      try {
        const data = await request(`/polls/${pollId}/analytics`);
        if (active) {
          setPoll(data.poll);
          setAnalytics(data.analytics);
        }
      } catch (apiError) {
        if (active) setError(apiError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      active = false;
    };
  }, [pollId]);

  useEffect(() => {
    if (!poll?.publicId) return undefined;

    const socket = createSocket({ room: poll.publicId });
    const analyticsHandler = createDebouncedHandler((event) => {
      if (event.publicId === poll.publicId) {
        setAnalytics(event.analytics);
        setPoll((current) =>
          current ? { ...current, responseCount: event.analytics.totalResponses } : current
        );
      }
    });
    socket.on("poll:analytics", analyticsHandler.handle);
    socket.on("poll:published", (event) => {
      if (event.publicId === poll.publicId) {
        setAnalytics(event.analytics);
        setPoll((current) =>
          current
            ? {
                ...current,
                isPublished: true,
                active: false,
                publishedAt: event.analytics.participation.publishedAt
              }
            : current
        );
      }
    });
    socket.on("poll:updated", (event) => {
      if (event.publicId === poll.publicId) {
        setPoll(event.poll);
      }
    });
    socket.on("poll:deleted", (event) => {
      if (event.publicId === poll.publicId) {
        setError("This poll was deleted.");
      }
    });

    return () => {
      analyticsHandler.cancel();
      socket.emit("poll:leave", poll.publicId);
      socket.disconnect();
    };
  }, [poll?.publicId]);

  async function copyShareLink() {
    await copyToClipboard(publicPollLink(poll.publicId));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function publishResults() {
    setPublishing(true);
    setError("");

    try {
      const data = await request(`/polls/${pollId}/publish`, {
        method: "PATCH"
      });
      setPoll(data.poll);
      setAnalytics(data.analytics);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return <div className="panel empty-state">Loading analytics...</div>;
  }

  if (error && !poll) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <motion.section
      className="stack"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="page-title-row analytics-title analytics-hero">
        <div>
          <Link className="back-link" to="/dashboard">
            <ArrowLeft size={17} />
            <span>Dashboard</span>
          </Link>
          <div className="title-inline">
            <h1>{poll.title}</h1>
            <StatusPill poll={poll} />
          </div>
          <p>{poll.description || "Live response analytics for this poll."}</p>
        </div>
        <div className="title-actions">
          <a
            className="button button-secondary"
            href={`/p/${poll.publicId}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={18} />
            <span>Open link</span>
          </a>
          <button className="button button-quiet" type="button" onClick={copyShareLink}>
            <Clipboard size={18} />
            <span>{copied ? "Copied" : "Copy link"}</span>
          </button>
          {!poll.isPublished && (
            <Link className="button button-secondary" to={`/polls/${poll.id}/edit`}>
              <Pencil size={18} />
              <span>Edit poll</span>
            </Link>
          )}
          <button
            className="button"
            type="button"
            onClick={publishResults}
            disabled={poll.isPublished || publishing}
          >
            <Send size={18} />
            <span>{poll.isPublished ? "Published" : publishing ? "Publishing..." : "Publish results"}</span>
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="live-strip">
        <RadioTower size={20} />
        <span>Live updates are connected for response counts and summaries.</span>
        <strong>{analytics.totalResponses} responses</strong>
      </section>

      <section className="panel poll-details">
        <div>
          <span className="eyebrow">Public link</span>
          <p>{publicPollLink(poll.publicId)}</p>
        </div>
        <div>
          <span className="eyebrow">Mode</span>
          <p>{poll.responseMode === "authenticated" ? "Authenticated responses" : "Anonymous responses"}</p>
        </div>
        <div>
          <span className="eyebrow">Expires</span>
          <p>{formatDate(poll.expiresAt)}</p>
        </div>
      </section>

      <ResultSummary analytics={analytics} />
    </motion.section>
  );
}
