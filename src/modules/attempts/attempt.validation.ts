import { AttemptStatus } from "@prisma/client";
import { z } from "zod";

export const assessmentIdSchema = z.object({
  params: z.object({ assessmentId: z.string().uuid() }),
});

export const attemptIdSchema = z.object({
  params: z.object({ attemptId: z.string().uuid() }),
});

export const answerSchema = z.object({
  params: z.object({
    attemptId: z.string().uuid(),
    questionId: z.string().uuid(),
  }),
  body: z.object({
    response: z
      .unknown()
      .refine((value) => value !== null && value !== undefined, "Response is required"),
  }),
});

export const myAttemptsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.nativeEnum(AttemptStatus).optional(),
  }),
});
