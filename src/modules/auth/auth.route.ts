

import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimiter";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./auth.controller";
import {
  googleSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from "./auth.validation";

export const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  controller.register,
);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a candidate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Candidate registered successfully
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Email already exists
 */

authRouter.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  controller.login,
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Login a Candidate, Reviewer or Admin using email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */

authRouter.post(
  "/google",
  authLimiter,
  validateRequest(googleSchema),
  controller.googleLogin,
);
authRouter.post(
  "/refresh-token",
  authLimiter,
  validateRequest(refreshSchema),
  controller.refresh,
);

authRouter.post("/logout", validateRequest(logoutSchema), controller.logout);
