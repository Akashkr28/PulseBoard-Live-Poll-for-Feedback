import express from "express";
import { optionalAuth } from "../middleware/auth.js";
import { Poll } from "../models/Poll.js";
import { Response } from "../models/Response.js";
import { buildPollAnalytics } from "../utils/analytics.js";
import { asyncHandler, httpError } from "../utils/http.js";

const router = express.Router();

function publicQuestions(poll) {
  return poll.questions.map((question) => ({
    id: question._id,
    text: question.text,
    required: question.required,
    options: question.options.map((option) => ({
      id: option._id,
      label: option.label
    }))
  }));
}

function publicPollPayload(poll, responseCount = 0) {
  return {
    id: poll._id,
    publicId: poll.publicId,
    title: poll.title,
    description: poll.description,
    responseMode: poll.responseMode,
    expiresAt: poll.expiresAt,
    expired: poll.isExpired(),
    active: poll.canAcceptResponses(),
    isPublished: poll.isPublished,
    publishedAt: poll.publishedAt,
    responseCount,
    questions: publicQuestions(poll)
  };
}

function validateAnswers(poll, submittedAnswers = []) {
  if (!Array.isArray(submittedAnswers)) {
    throw httpError(422, "Answers must be sent as an array.");
  }

  const questionMap = new Map(
    poll.questions.map((question) => [question._id.toString(), question])
  );
  const cleanAnswers = [];
  const seenQuestions = new Set();

  for (const answer of submittedAnswers) {
    const questionId = String(answer.questionId || "");
    const optionId = String(answer.optionId || "");
    const question = questionMap.get(questionId);

    if (!question) {
      throw httpError(422, "One of the answers points to an unknown question.");
    }

    if (seenQuestions.has(questionId)) {
      throw httpError(422, "Each question can only be answered once.");
    }

    const option = question.options.id(optionId);
    if (!option) {
      throw httpError(422, "One of the answers points to an unknown option.");
    }

    seenQuestions.add(questionId);
    cleanAnswers.push({
      questionId: question._id,
      optionId: option._id
    });
  }

  const answeredQuestionIds = new Set(cleanAnswers.map((answer) => answer.questionId.toString()));
  const missingRequired = poll.questions
    .filter((question) => question.required && !answeredQuestionIds.has(question._id.toString()))
    .map((question) => question.text);

  if (missingRequired.length) {
    throw httpError(422, "Please answer every mandatory question.", {
      missingRequired
    });
  }

  return cleanAnswers;
}

router.get(
  "/:publicId",
  asyncHandler(async (req, res) => {
    const poll = await Poll.findOne({ publicId: req.params.publicId });

    if (!poll) {
      throw httpError(404, "Poll not found.");
    }

    const responseCount = await Response.countDocuments({ poll: poll._id });
    const payload = publicPollPayload(poll, responseCount);

    if (poll.isPublished) {
      const analytics = await buildPollAnalytics(poll);
      res.json({ poll: payload, analytics });
      return;
    }

    res.json({ poll: payload });
  })
);

router.post(
  "/:publicId/responses",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const poll = await Poll.findOne({ publicId: req.params.publicId });

    if (!poll) {
      throw httpError(404, "Poll not found.");
    }

    if (poll.isPublished) {
      throw httpError(409, "This poll has published results and is no longer accepting responses.");
    }

    if (poll.isExpired()) {
      throw httpError(410, "This poll has expired.");
    }

    if (poll.responseMode === "authenticated" && !req.user) {
      throw httpError(401, "Sign in to submit this poll.");
    }

    if (poll.responseMode === "authenticated") {
      const alreadySubmitted = await Response.exists({
        poll: poll._id,
        respondent: req.user._id
      });

      if (alreadySubmitted) {
        throw httpError(409, "You have already submitted this poll.");
      }
    }

    const answers = validateAnswers(poll, req.body.answers);
    const response = await Response.create({
      poll: poll._id,
      respondent: poll.responseMode === "authenticated" ? req.user._id : null,
      respondentType: poll.responseMode,
      answers,
      metadata: {
        ipHash: Response.hashIp(req.ip),
        userAgent: String(req.headers["user-agent"] || "").slice(0, 300)
      }
    });

    const analytics = await buildPollAnalytics(poll);
    req.io.to(`poll:${poll.publicId}`).emit("poll:submitted", {
      publicId: poll.publicId,
      responseId: response._id,
      totalResponses: analytics.totalResponses
    });
    req.io.to(`poll:${poll.publicId}`).emit("poll:analytics", {
      publicId: poll.publicId,
      analytics
    });

    res.status(201).json({
      message: "Thanks, your response was submitted.",
      analytics
    });
  })
);

export default router;
