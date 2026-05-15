import { CheckCircle2, Clock3, MessageSquareText, Users } from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function formatDate(value) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function ResultSummary({ analytics }) {
  if (!analytics) return null;

  const { participation } = analytics;
  const timeline =
    participation.timeline.length > 0
      ? participation.timeline
      : [{ date: "No responses", count: 0 }];
  const modeData = [
    {
      name: "Authenticated",
      value: participation.authenticatedResponses,
      color: "#2f6fda"
    },
    {
      name: "Anonymous",
      value: participation.anonymousResponses,
      color: "#0f8f84"
    }
  ].filter((item) => item.value > 0);
  const visibleModeData = modeData.length
    ? modeData
    : [{ name: "No responses", value: 1, color: "#334155" }];

  return (
    <div className="results-stack">
      <section className="metric-grid" aria-label="Participation summary">
        <article className="metric">
          <Users size={22} />
          <div>
            <span>Total responses</span>
            <strong>{analytics.totalResponses}</strong>
          </div>
        </article>
        <article className="metric">
          <MessageSquareText size={22} />
          <div>
            <span>Avg answered</span>
            <strong>{participation.averageAnsweredQuestions}</strong>
          </div>
        </article>
        <article className="metric">
          <CheckCircle2 size={22} />
          <div>
            <span>Completion</span>
            <strong>{participation.completionRate}%</strong>
          </div>
        </article>
        <article className="metric">
          <Clock3 size={22} />
          <div>
            <span>Last response</span>
            <strong className="metric-date">
              {formatDate(participation.lastSubmittedAt)}
            </strong>
          </div>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="chart-card">
          <div className="chart-head">
            <div>
              <span className="eyebrow">Response pace</span>
              <h3>Daily participation</h3>
            </div>
          </div>
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeline} margin={{ top: 10, right: 8, left: -18, bottom: 4 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{
                    color: "#f7fafc",
                    background: "#0f172a",
                    border: "1px solid rgba(148, 163, 184, 0.24)",
                    borderRadius: 8,
                    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.36)"
                  }}
                  labelStyle={{ color: "#d9e3f0" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2f6fda"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2f6fda" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-head">
            <div>
              <span className="eyebrow">Audience mix</span>
              <h3>Response identity</h3>
            </div>
          </div>
          <div className="donut-layout">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={visibleModeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={4}
                >
                  {visibleModeData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    color: "#f7fafc",
                    background: "#0f172a",
                    border: "1px solid rgba(148, 163, 184, 0.24)",
                    borderRadius: 8,
                    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.36)"
                  }}
                  labelStyle={{ color: "#d9e3f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend-list">
              {visibleModeData.map((item) => (
                <span key={item.name}>
                  <i style={{ background: item.color }} />
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="question-results" aria-label="Question results">
        {analytics.questionSummaries.map((question) => (
          <article className="result-card" key={question.questionId}>
            <div className="result-card-head">
              <div>
                <h3>{question.text}</h3>
                <p>
                  {question.answeredCount} answered
                  {question.skippedCount ? `, ${question.skippedCount} skipped` : ""}
                </p>
              </div>
              <span className="pill">{question.required ? "Mandatory" : "Optional"}</span>
            </div>

            <div className="option-results">
              {question.options.map((option) => (
                <div className="option-result" key={option.optionId}>
                  <div className="option-row">
                    <span>{option.label}</span>
                    <strong>
                      {option.count} · {option.percentage}%
                    </strong>
                  </div>
                  <div className="bar-track" aria-hidden="true">
                    <span style={{ width: `${option.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
