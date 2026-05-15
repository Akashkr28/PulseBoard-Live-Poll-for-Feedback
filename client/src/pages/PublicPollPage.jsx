import { CalendarClock, CheckCircle2, LockKeyhole, RadioTower, Send, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ResultSummary from "../components/ResultSummary.jsx";
import { useAuth } from "../context/useAuth.js";
import { request } from "../lib/api.js";
import { createSocket } from "../lib/socket.js";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function PublicPollPage() {
  const { publicId } = useParams();
  const { token, user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [liveCount, setLiveCount] = useState(0);

  const needsAuth = poll?.responseMode === "authenticated" && !user;
  const requiredMissing = useMemo(() => {
    if (!poll) return [];
    return poll.questions.filter((question) => question.required && !answers[question.id]);
  }, [answers, poll]);
  const answeredCount = Object.keys(answers).length;
  const progress = poll?.questions.length
    ? Math.round((answeredCount / poll.questions.length) * 100)
    : 0;

  useEffect(() => {
    let active = true;

    async function loadPoll() {
      try {
        const data = await request(`/public/polls/${publicId}`);
        if (active) {
          setPoll(data.poll);
          setAnalytics(data.analytics || null);
          setLiveCount(data.poll.responseCount || 0);
        }
      } catch (apiError) {
        if (active) setError(apiError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPoll();
    return () => {
      active = false;
    };
  }, [publicId]);

  useEffect(() => {
    const socket = createSocket();
    socket.emit("poll:join", publicId);
    socket.on("poll:submitted", (event) => {
      if (event.publicId === publicId) setLiveCount(event.totalResponses);
    });
    socket.on("poll:published", (event) => {
      if (event.publicId === publicId) {
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

    return () => {
      socket.emit("poll:leave", publicId);
      socket.disconnect();
    };
  }, [publicId]);

  function chooseAnswer(questionId, optionId) {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionId
    }));
  }

  async function submitResponse(event) {
    event.preventDefault();
    setError("");

    if (needsAuth) {
      setError("Sign in to submit this poll.");
      return;
    }

    if (requiredMissing.length) {
      setError("Please answer every mandatory question.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId
        }))
      };
      const data = await request(`/public/polls/${publicId}/responses`, {
        method: "POST",
        token,
        body: payload
      });
      setSubmitted(true);
      setLiveCount(data.analytics.totalResponses);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="panel empty-state">Loading poll...</div>;
  }

  if (error && !poll) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (poll.isPublished) {
    return (
      <section className="public-shell">
        <div className="public-head">
          <span className="eyebrow">Published results</span>
          <h1>{poll.title}</h1>
          {poll.description && <p>{poll.description}</p>}
        </div>
        <ResultSummary analytics={analytics} />
      </section>
    );
  }

  if (!poll.active) {
    return (
      <section className="panel empty-state public-closed">
        <RadioTower size={36} />
        <h1>{poll.title}</h1>
        <p>This poll closed on {formatDate(poll.expiresAt)}. Results will appear here once the creator publishes them.</p>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="panel empty-state public-closed">
        <CheckCircle2 size={38} />
        <h1>Response submitted</h1>
        <p>Thanks for sharing your feedback. The creator will see it in their live analytics dashboard.</p>
        <div className="live-strip compact">
          <RadioTower size={18} />
          <span>{liveCount} total responses so far</span>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      className="public-shell"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="public-head">
        <span className="eyebrow">
          {poll.responseMode === "authenticated" ? "Authenticated poll" : "Anonymous poll"}
        </span>
        <h1>{poll.title}</h1>
        {poll.description && <p>{poll.description}</p>}
        <div className="public-meta">
          <span>
            <CalendarClock size={16} />
            Closes {formatDate(poll.expiresAt)}
          </span>
          <span>
            <Users size={16} />
            {liveCount} responses collected
          </span>
        </div>
      </div>

      {needsAuth && (
        <div className="alert auth-required">
          <LockKeyhole size={18} />
          <span>Sign in before submitting this poll.</span>
          <Link to="/login" state={{ from: { pathname: `/p/${publicId}` } }}>
            Sign in
          </Link>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <form className="response-form" onSubmit={submitResponse}>
        <section className="response-progress" aria-label="Answer progress">
          <div>
            <span>{answeredCount} of {poll.questions.length} answered</span>
            <strong>{progress}%</strong>
          </div>
          <div className="bar-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>

        {poll.questions.map((question, index) => (
          <motion.fieldset
            className="panel response-question"
            key={question.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.035 }}
          >
            <legend>
              <span>Question {index + 1}</span>
              <strong>{question.text}</strong>
            </legend>
            <span className="pill">{question.required ? "Mandatory" : "Optional"}</span>
            <div className="choice-list">
              {question.options.map((option) => (
                <label className="choice" key={option.id}>
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === option.id}
                    onChange={() => chooseAnswer(question.id, option.id)}
                    required={question.required}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </motion.fieldset>
        ))}

        <button className="button submit-response" disabled={submitting || needsAuth}>
          <Send size={18} />
          <span>{submitting ? "Submitting..." : "Submit feedback"}</span>
        </button>
      </form>
    </motion.section>
  );
}
