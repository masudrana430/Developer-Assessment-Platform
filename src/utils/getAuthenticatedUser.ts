import type { Request } from "express";
import { AppError } from "./AppError";

type AuthenticatedUser = NonNullable<Request["user"]>;

/**
 * Narrows the user populated by authentication middleware and provides a
 * consistent 401 response if an authenticated controller is misconfigured.
 */
export const getAuthenticatedUser = (user: Request["user"]): AuthenticatedUser => {
  if (!user) {
    throw new AppError(401, "Authentication is required");
  }

  return user;
};
