import { Poll } from "../models/Poll.js";
import { Response } from "../models/Response.js";

function asId(value) {
  return value.toString();
}

function percentage(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function bucketByDay(date) {
  return date.toISOString().slice(0, 10);
}

export async function buildPollAnalytics(pollOrId) {
  const poll =
    typeof pollOrId === "string" || pollOrId?._bsontype
      ? await Poll.findById(pollOrId)
      : pollOrId;

  if (!poll) return null;

  const responses = await Response.find({ poll: poll._id }).sort({ createdAt: 1 });
  const totalResponses = responses.length;
  const questionMap = new Map();
  const timelineMap = new Map();
  let totalAnswered = 0;
  let anonymousResponses = 0;
  let authenticatedResponses = 0;

  for (const question of poll.questions) {
    const optionCounts = new Map();

    for (const option of question.options) {
      optionCounts.set(asId(option._id), 0);
    }

    questionMap.set(asId(question._id), {
      question,
      answeredCount: 0,
      optionCounts
    });
  }

  for (const response of responses) {
    if (response.respondentType === "authenticated") {
      authenticatedResponses += 1;
    } else {
      anonymousResponses += 1;
    }

    const day = bucketByDay(response.createdAt);
    timelineMap.set(day, (timelineMap.get(day) || 0) + 1);

    for (const answer of response.answers) {
      const summary = questionMap.get(asId(answer.questionId));
      if (!summary) continue;

      const optionId = asId(answer.optionId);
      if (!summary.optionCounts.has(optionId)) continue;

      summary.answeredCount += 1;
      summary.optionCounts.set(optionId, summary.optionCounts.get(optionId) + 1);
      totalAnswered += 1;
    }
  }

  const questionSummaries = Array.from(questionMap.values()).map(
    ({ question, answeredCount, optionCounts }) => ({
      questionId: question._id,
      text: question.text,
      required: question.required,
      answeredCount,
      skippedCount: Math.max(totalResponses - answeredCount, 0),
      options: question.options.map((option) => {
        const count = optionCounts.get(asId(option._id)) || 0;
        return {
          optionId: option._id,
          label: option.label,
          count,
          percentage: percentage(count, answeredCount)
        };
      })
    })
  );

  const questionCount = poll.questions.length;
  const lastResponse = responses[responses.length - 1] || null;

  return {
    pollId: poll._id,
    publicId: poll.publicId,
    totalResponses,
    questionSummaries,
    participation: {
      responseMode: poll.responseMode,
      anonymousResponses,
      authenticatedResponses,
      questionCount,
      averageAnsweredQuestions: totalResponses
        ? Math.round((totalAnswered / totalResponses) * 10) / 10
        : 0,
      completionRate: percentage(totalAnswered, totalResponses * questionCount),
      expiresAt: poll.expiresAt,
      expired: poll.isExpired(),
      active: poll.canAcceptResponses(),
      published: poll.isPublished,
      publishedAt: poll.publishedAt,
      lastSubmittedAt: lastResponse?.createdAt || null,
      timeline: Array.from(timelineMap.entries()).map(([date, count]) => ({
        date,
        count
      }))
    }
  };
}
