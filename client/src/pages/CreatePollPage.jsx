import {
  ArrowLeft,
  Check,
  CirclePlus,
  GripVertical,
  ListChecks,
  Save,
  ShieldCheck,
  TimerReset,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { request } from "../lib/api.js";
import { currentInputValue, toDateTimeInput, tomorrowInputValue } from "../lib/dates.js";

function blankQuestion() {
  return {
    text: "",
    required: true,
    options: [{ label: "" }, { label: "" }]
  };
}

function questionFromApi(question) {
  return {
    text: question.text,
    required: question.required,
    options: question.options.map((option) => ({ label: option.label }))
  };
}

export default function CreatePollPage() {
  const navigate = useNavigate();
  const { pollId } = useParams();
  const editing = Boolean(pollId);
  const [form, setForm] = useState({
    title: "",
    description: "",
    responseMode: "anonymous",
    expiresAt: tomorrowInputValue(),
    questions: [blankQuestion()]
  });
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const questionsEditable = !editing || (poll?.responseCount || 0) === 0;
  const canRemoveQuestion = form.questions.length > 1;
  const builderStats = useMemo(
    () => ({
      questions: form.questions.length,
      mandatory: form.questions.filter((question) => question.required).length,
      options: form.questions.reduce(
        (sum, question) =>
          sum + question.options.filter((option) => option.label.trim()).length,
        0
      )
    }),
    [form.questions]
  );

  useEffect(() => {
    if (!editing) return undefined;

    let active = true;

    async function loadPoll() {
      try {
        const data = await request(`/polls/${pollId}`);
        if (!active) return;

        setPoll(data.poll);
        setForm({
          title: data.poll.title,
          description: data.poll.description || "",
          responseMode: data.poll.responseMode,
          expiresAt: toDateTimeInput(data.poll.expiresAt),
          questions: data.poll.questions.map(questionFromApi)
        });
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
  }, [editing, pollId]);

  const questionIssues = useMemo(
    () =>
      form.questions
        .map((question, index) => {
          const optionCount = question.options.filter((option) => option.label.trim()).length;
          if (!question.text.trim()) return `Question ${index + 1} needs text.`;
          if (optionCount < 2) return `Question ${index + 1} needs at least two options.`;
          return "";
        })
        .filter(Boolean),
    [form.questions]
  );

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateQuestion(index, patch) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      )
    }));
  }

  function updateOption(questionIndex, optionIndex, label) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) return question;
        return {
          ...question,
          options: question.options.map((option, currentOptionIndex) =>
            currentOptionIndex === optionIndex ? { ...option, label } : option
          )
        };
      })
    }));
  }

  function addOption(questionIndex) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex
          ? { ...question, options: [...question.options, { label: "" }] }
          : question
      )
    }));
  }

  function removeOption(questionIndex, optionIndex) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex || question.options.length <= 2) {
          return question;
        }

        return {
          ...question,
          options: question.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex)
        };
      })
    }));
  }

  function addQuestion() {
    setForm((current) => ({
      ...current,
      questions: [...current.questions, blankQuestion()]
    }));
  }

  function removeQuestion(index) {
    setForm((current) => ({
      ...current,
      questions: current.questions.filter((_, questionIndex) => questionIndex !== index)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Poll title is required.");
      return;
    }

    if (new Date(form.expiresAt).getTime() <= Date.now()) {
      setError("Choose an expiry time in the future.");
      return;
    }

    if (questionsEditable && questionIssues.length) {
      setError(questionIssues[0]);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        responseMode: form.responseMode,
        expiresAt: new Date(form.expiresAt).toISOString(),
        ...(questionsEditable
          ? {
              questions: form.questions.map((question) => ({
                ...question,
                options: question.options.filter((option) => option.label.trim())
              }))
            }
          : {})
      };
      const data = await request(editing ? `/polls/${pollId}` : "/polls", {
        method: editing ? "PATCH" : "POST",
        body: payload
      });
      navigate(`/polls/${data.poll.id}/analytics`);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="panel empty-state">Loading poll...</div>;
  }

  return (
    <motion.section
      className="stack"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="page-title-row builder-hero">
        <div>
          <Link className="back-link" to="/dashboard">
            <ArrowLeft size={17} />
            <span>Dashboard</span>
          </Link>
          <h1>{editing ? "Edit poll" : "Create a poll"}</h1>
          <p>
            {editing
              ? "Refine the poll settings before publishing the final result."
              : "Shape the response flow, choose identity rules, and set a clear closing window."}
          </p>
        </div>
        <div className="builder-summary" aria-label="Poll draft summary">
          <span>
            <ListChecks size={18} />
            {builderStats.questions} questions
          </span>
          <span>
            <ShieldCheck size={18} />
            {builderStats.mandatory} mandatory
          </span>
          <span>
            <TimerReset size={18} />
            {builderStats.options} options
          </span>
        </div>
      </div>

      <form className="creator-layout" onSubmit={handleSubmit}>
        <aside className="panel settings-panel">
          <h2>Poll settings</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {!questionsEditable && (
            <div className="alert auth-required">
              Questions are locked after responses arrive. You can still update title, description, mode and expiry.
            </div>
          )}

          <label className="field">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Sprint retro feedback"
              maxLength={120}
              required
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="A short note respondents will see before answering."
              maxLength={600}
              rows={4}
            />
          </label>

          <fieldset className="field">
            <span>Response mode</span>
            <div className="segmented">
              <label>
                <input
                  type="radio"
                  checked={form.responseMode === "anonymous"}
                  onChange={() => updateForm("responseMode", "anonymous")}
                />
                <span>Anonymous</span>
              </label>
              <label>
                <input
                  type="radio"
                  checked={form.responseMode === "authenticated"}
                  onChange={() => updateForm("responseMode", "authenticated")}
                />
                <span>Signed in</span>
              </label>
            </div>
          </fieldset>

          <label className="field">
            <span>Expiry time</span>
            <input
              type="datetime-local"
              value={form.expiresAt}
              min={currentInputValue()}
              onChange={(event) => updateForm("expiresAt", event.target.value)}
              required
            />
          </label>

          <button className="button button-wide" disabled={saving}>
            <Save size={18} />
            <span>{saving ? "Saving..." : editing ? "Update poll" : "Save poll"}</span>
          </button>
        </aside>

        <div className="question-builder">
          {form.questions.map((question, questionIndex) => (
            <motion.article
              className="panel question-editor"
              key={questionIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="question-editor-head">
                <GripVertical size={19} />
                <div>
                  <span className="eyebrow">Question {questionIndex + 1}</span>
                  <input
                    value={question.text}
                    onChange={(event) =>
                      updateQuestion(questionIndex, { text: event.target.value })
                    }
                    placeholder="What should we ask?"
                    maxLength={240}
                    required
                    disabled={!questionsEditable}
                  />
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => removeQuestion(questionIndex)}
                  disabled={!questionsEditable || !canRemoveQuestion}
                >
                  <Trash2 size={18} />
                  <span className="sr-only">Remove question</span>
                </button>
              </div>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(event) =>
                    updateQuestion(questionIndex, { required: event.target.checked })
                  }
                  disabled={!questionsEditable}
                />
                <span>
                  <Check size={16} />
                  Mandatory question
                </span>
              </label>

              <div className="option-editor-list">
                {question.options.map((option, optionIndex) => (
                  <div className="option-editor" key={optionIndex}>
                    <span>{optionIndex + 1}</span>
                    <input
                      value={option.label}
                      onChange={(event) =>
                        updateOption(questionIndex, optionIndex, event.target.value)
                      }
                      placeholder={`Option ${optionIndex + 1}`}
                      maxLength={140}
                      required={optionIndex < 2}
                      disabled={!questionsEditable}
                    />
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => removeOption(questionIndex, optionIndex)}
                      disabled={!questionsEditable || question.options.length <= 2}
                    >
                      <Trash2 size={16} />
                      <span className="sr-only">Remove option</span>
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="button button-quiet"
                type="button"
                onClick={() => addOption(questionIndex)}
                disabled={!questionsEditable}
              >
                <CirclePlus size={17} />
                <span>Add option</span>
              </button>
            </motion.article>
          ))}

          <button
            className="button button-secondary add-question"
            type="button"
            onClick={addQuestion}
            disabled={!questionsEditable}
          >
            <CirclePlus size={18} />
            <span>Add question</span>
          </button>
        </div>
      </form>
    </motion.section>
  );
}
