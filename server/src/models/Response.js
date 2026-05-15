import crypto from "crypto";
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
      index: true
    },
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    respondentType: {
      type: String,
      enum: ["anonymous", "authenticated"],
      required: true
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    metadata: {
      ipHash: String,
      userAgent: String
    }
  },
  { timestamps: true }
);

responseSchema.index(
  { poll: 1, respondent: 1 },
  {
    unique: true,
    partialFilterExpression: { respondent: { $type: "objectId" } }
  }
);

responseSchema.statics.hashIp = function hashIp(ip = "") {
  return crypto.createHash("sha256").update(ip).digest("hex");
};

export const Response = mongoose.model("Response", responseSchema);
