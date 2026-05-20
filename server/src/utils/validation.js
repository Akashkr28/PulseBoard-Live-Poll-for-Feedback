import { z } from "zod";
import { httpError } from "./http.js";

const responseModes = ["anonymous", "authenticated"];

const optionInputSchema = z
  .object({
    label: z.string().optional(),
    text: z.string().optional()
  })
  .transform((option) => ({
    label: String(option.label ?? option.text ?? "").trim()
  }))
  .pipe(
    z.object({
      label: z.string().min(1, "Option text is required.").max(140)
    })
  );

export const questionInputSchema = z.object({
  text: z.string().trim().min(1, "Question text is required.").max(240),
  required: z.boolean().default(true),
  options: z.array(optionInputSchema).min(2, "Each question needs at least two options.").max(12)
});

function futureDate(message) {
  return z.coerce.date().refine((date) => date.getTime() > Date.now(), message);
}

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters.").max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});

export const pollCreateSchema = z.object({
  title: z.string().trim().min(1, "Poll title is required.").max(120),
  description: z.string().trim().max(600).optional().default(""),
  responseMode: z.enum(responseModes).default("anonymous"),
  expiresAt: futureDate("Expiry time must be in the future."),
  questions: z.array(questionInputSchema).min(1, "Add at least one question.").max(25)
});

export const pollUpdateSchema = z
  .object({
    title: z.string().trim().min(1, "Poll title is required.").max(120).optional(),
    description: z.string().trim().max(600).optional(),
    responseMode: z.enum(responseModes).optional(),
    expiresAt: futureDate("Expiry time must be in the future.").optional(),
    questions: z.array(questionInputSchema).min(1, "Add at least one question.").max(25).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Send at least one poll field to update."
  });

export const responsePayloadSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().trim().min(1, "Question id is required."),
        optionId: z.string().trim().min(1, "Option id is required.")
      })
    )
    .max(100)
});

export function parseBody(schema, body) {
  const result = schema.safeParse(body);

  if (result.success) {
    return result.data;
  }

  const details = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));

  throw httpError(422, details[0]?.message || "Request validation failed.", details);
}
