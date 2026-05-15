import crypto from "crypto";
import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    order: {
      type: Number,
      required: true
    }
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240
    },
    required: {
      type: Boolean,
      default: true
    },
    options: {
      type: [optionSchema],
      validate: {
        validator(options) {
          return options.length >= 2;
        },
        message: "Each question needs at least two options."
      }
    }
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    publicId: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(7).toString("hex")
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 600,
      default: ""
    },
    responseMode: {
      type: String,
      enum: ["anonymous", "authenticated"],
      default: "anonymous"
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator(questions) {
          return questions.length > 0;
        },
        message: "A poll needs at least one question."
      }
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

pollSchema.methods.isExpired = function isExpired() {
  return this.expiresAt.getTime() <= Date.now();
};

pollSchema.methods.canAcceptResponses = function canAcceptResponses() {
  return !this.isPublished && !this.isExpired();
};

export const Poll = mongoose.model("Poll", pollSchema);
