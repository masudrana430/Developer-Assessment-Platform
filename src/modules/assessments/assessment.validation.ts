import { AssessmentStatus, Difficulty, QuestionType } from "@prisma/client";
import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case");

export const createAssessmentSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150),
    slug,
    description: z.string().trim().min(20).max(5000),
    difficulty: z.nativeEnum(Difficulty),
    durationMinutes: z.number().int().min(5).max(480),
    passingScore: z.number().min(0).max(100),
    feeCents: z.number().int().min(0).max(10000000).default(0),
    currency: z.string().trim().length(3).transform((v) => v.toLowerCase()).default("usd")
  })
});

export const updateAssessmentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      title: z.string().trim().min(3).max(150).optional(),
      slug: slug.optional(),
      description: z.string().trim().min(20).max(5000).optional(),
      difficulty: z.nativeEnum(Difficulty).optional(),
      durationMinutes: z.number().int().min(5).max(480).optional(),
      passingScore: z.number().min(0).max(100).optional(),
      feeCents: z.number().int().min(0).max(10000000).optional(),
      currency: z.string().trim().length(3).transform((v) => v.toLowerCase()).optional()
    })
    .refine((data) => Object.keys(data).length > 0, "At least one field is required")
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});

export const listAssessmentSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(),
    difficulty: z.nativeEnum(Difficulty).optional(),
    status: z.nativeEnum(AssessmentStatus).optional(),
    sortBy: z.enum(["createdAt", "title", "feeCents", "durationMinutes"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
  })
});

const questionBody = z
  .object({
    prompt: z.string().trim().min(3).max(10000),
    type: z.nativeEnum(QuestionType),
    options: z.array(z.string().min(1)).min(2).max(10).optional(),
    correctAnswer: z.unknown().optional(),
    points: z.number().int().min(1).max(100),
    order: z.number().int().min(1).max(1000)
  })
  .superRefine((data, ctx) => {
    if (data.type === QuestionType.MCQ) {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "MCQ questions require at least two options"
        });
      }
      if (data.correctAnswer === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["correctAnswer"],
          message: "MCQ questions require a correctAnswer"
        });
      }
    }
  });

export const createQuestionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: questionBody
});

export const updateQuestionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    questionId: z.string().uuid()
  }),
  body: z.object({
    prompt: z.string().trim().min(3).max(10000).optional(),
    type: z.nativeEnum(QuestionType).optional(),
    options: z.array(z.string().min(1)).min(2).max(10).nullable().optional(),
    correctAnswer: z.unknown().nullable().optional(),
    points: z.number().int().min(1).max(100).optional(),
    order: z.number().int().min(1).max(1000).optional()
  })
});

export const questionParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    questionId: z.string().uuid()
  })
});


export const manageListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(),
    status: z.nativeEnum(AssessmentStatus).optional()
  })
});
