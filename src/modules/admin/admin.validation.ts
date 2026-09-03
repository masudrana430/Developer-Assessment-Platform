import { Role, UserStatus } from "@prisma/client";
import { z } from "zod";

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
  body: z.object({
    status: z.nativeEnum(UserStatus),
  }),
});

export const userIdSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
});

export const auditListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    action: z.string().trim().max(100).optional(),
    entityType: z.string().trim().max(100).optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
  body: z.object({
    role: z.nativeEnum(Role),
  }),
});
