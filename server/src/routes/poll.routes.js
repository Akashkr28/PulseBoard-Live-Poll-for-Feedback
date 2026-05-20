import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Poll } from "../models/Poll.js";
import { Response } from "../models/Response.js";
import { buildPollAnalytics } from "../utils/analytics.js";
import { asyncHandler, httpError } from "../utils/http.js";
import { parseBody, pollCreateSchema, pollUpdateSchema } from "../utils/validation.js";

const router = express.Router();

function normalizeQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw httpError(422, "Add at least one question.");
  }

  return questions.map((question, questionIndex) => {
    const text = String(question.text || "").trim();
    const options = Array.isArray(question.options) ? question.options : [];

    if (!text) {
      throw httpError(422, `Question ${questionIndex + 1} needs text.`);
    }

    const cleanOptions = options
      .map((option) => String(option.label || option.text || "").trim())
      .filter(Boolean)
      .map((label, optionIndex) => ({
        label,
        order: optionIndex
      }));

    if (cleanOptions.length < 2) {
      throw httpError(
        422,
        `Question ${questionIndex + 1} needs at least two options.`
      );
    }

    return {
      text,
      required: Boolean(question.required),
      options: cleanOptions
    };
  });
}

function serializePoll(poll, responseCount = 0) {
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
    questionCount: poll.questions.length,
    questions: poll.questions,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt
  };
}

async function findOwnedPoll(req) {
  const poll = await Poll.findOne({
    _id: req.params.id,
    owner: req.user._id
  });

  if (!poll) {
    throw httpError(404, "Poll not found.");
  }

  return poll;
}

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const polls = await Poll.find({ owner: req.user._id }).sort({ createdAt: -1 });
    const ids = polls.map((poll) => poll._id);
    const counts = await Response.aggregate([
      { $match: { poll: { $in: ids } } },
      { $group: { _id: "$poll", count: { $sum: 1 } } }
    ]);
    const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));

    res.json({
      polls: polls.map((poll) =>
        serializePoll(poll, countMap.get(poll._id.toString()) || 0)
      )
    });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = parseBody(pollCreateSchema, req.body);

    const poll = await Poll.create({
      owner: req.user._id,
      title: payload.title,
      description: payload.description,
      responseMode: payload.responseMode,
      expiresAt: payload.expiresAt,
      questions: normalizeQuestions(payload.questions)
    });

    res.status(201).json({ poll: serializePoll(poll) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const poll = await findOwnedPoll(req);
    const responseCount = await Response.countDocuments({ poll: poll._id });
    res.json({ poll: serializePoll(poll, responseCount) });
  })
);

router.get(
  "/:id/analytics",
  asyncHandler(async (req, res) => {
    const poll = await findOwnedPoll(req);
    const analytics = await buildPollAnalytics(poll);
    res.json({ poll: serializePoll(poll, analytics.totalResponses), analytics });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const poll = await findOwnedPoll(req);
    const payload = parseBody(pollUpdateSchema, req.body);
    const responseCount = await Response.countDocuments({ poll: poll._id });

    if (poll.isPublished) {
      throw httpError(409, "Published polls cannot be edited.");
    }

    if (payload.questions && responseCount > 0) {
      throw httpError(409, "Questions can only be edited before responses arrive.");
    }

    for (const field of ["title", "description", "responseMode", "expiresAt"]) {
      if (payload[field] !== undefined) {
        poll[field] = payload[field];
      }
    }

    if (payload.questions) {
      poll.questions = normalizeQuestions(payload.questions);
    }

    await poll.save();

    req.io.to(`poll:${poll.publicId}`).emit("poll:updated", {
      publicId: poll.publicId,
      poll: serializePoll(poll, responseCount)
    });

    res.json({ poll: serializePoll(poll, responseCount) });
  })
);

router.patch(
  "/:id/publish",
  asyncHandler(async (req, res) => {
    const poll = await findOwnedPoll(req);

    if (!poll.isPublished) {
      poll.isPublished = true;
      poll.publishedAt = new Date();
      await poll.save();
    }

    const analytics = await buildPollAnalytics(poll);
    req.io.to(`poll:${poll.publicId}`).emit("poll:published", {
      publicId: poll.publicId,
      analytics
    });

    res.json({
      poll: serializePoll(poll, analytics.totalResponses),
      analytics
    });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const poll = await findOwnedPoll(req);

    await Response.deleteMany({ poll: poll._id });
    await poll.deleteOne();

    req.io.to(`poll:${poll.publicId}`).emit("poll:deleted", {
      publicId: poll.publicId
    });

    res.json({ message: "Poll deleted." });
  })
);

export default router;
