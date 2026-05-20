import assert from "node:assert/strict";
import test from "node:test";
import { createCsrfToken } from "../src/middleware/csrf.js";
import {
  parseBody,
  pollCreateSchema,
  pollUpdateSchema,
  registerSchema,
  responsePayloadSchema
} from "../src/utils/validation.js";

function futureIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

test("register schema trims names and normalizes email", () => {
  const payload = parseBody(registerSchema, {
    name: "  Akash Kumar  ",
    email: "AKASH@TEST.COM ",
    password: "password123"
  });

  assert.equal(payload.name, "Akash Kumar");
  assert.equal(payload.email, "akash@test.com");
});

test("poll create schema accepts a valid single-choice poll", () => {
  const payload = parseBody(pollCreateSchema, {
    title: "  Sprint retro  ",
    responseMode: "anonymous",
    expiresAt: futureIso(),
    questions: [
      {
        text: "What went well?",
        required: true,
        options: [{ label: "Planning" }, { label: "Delivery" }]
      }
    ]
  });

  assert.equal(payload.title, "Sprint retro");
  assert.equal(payload.questions[0].options.length, 2);
  assert.ok(payload.expiresAt instanceof Date);
});

test("poll create schema rejects incomplete questions", () => {
  assert.throws(
    () =>
      parseBody(pollCreateSchema, {
        title: "Broken poll",
        expiresAt: futureIso(),
        questions: [
          {
            text: "",
            required: true,
            options: [{ label: "Only one" }]
          }
        ]
      }),
    /Question text is required|Each question needs at least two options/
  );
});

test("poll update schema allows partial settings updates", () => {
  const payload = parseBody(pollUpdateSchema, {
    title: "Updated title",
    expiresAt: futureIso()
  });

  assert.equal(payload.title, "Updated title");
  assert.ok(payload.expiresAt instanceof Date);
});

test("response schema requires answers array", () => {
  assert.throws(() => parseBody(responsePayloadSchema, {}), /Required|Invalid input/);
});

test("csrf token generator creates high-entropy hex tokens", () => {
  const first = createCsrfToken();
  const second = createCsrfToken();

  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
});
