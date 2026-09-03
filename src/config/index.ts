import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  REDIS_URL: z.string().optional().or(z.literal("")),
  GOOGLE_CLIENT_ID: z.string().optional().or(z.literal("")),
  SMTP_HOST: z.string().optional().or(z.literal("")),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional().or(z.literal("")),
  SMTP_PASSWORD: z.string().optional().or(z.literal("")),
  EMAIL_FROM: z.string().default("DevAssess <no-reply@example.com>"),
  CLOUDINARY_CLOUD_NAME: z.string().optional().or(z.literal("")),
  CLOUDINARY_API_KEY: z.string().optional().or(z.literal("")),
  CLOUDINARY_API_SECRET: z.string().optional().or(z.literal("")),
  STRIPE_SECRET_KEY: z.string().optional().or(z.literal("")),
  STRIPE_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
  STRIPE_RETURN_URL: z.string().default("http://localhost:3000/payment/return"),
  STRIPE_SUCCESS_URL: z
  .string()
  .default(
    "http://localhost:5000/api/v1/payments/checkout/success?session_id={CHECKOUT_SESSION_ID}"
  ),

STRIPE_CANCEL_URL: z
  .string()
  .default(
    "http://localhost:5000/api/v1/payments/checkout/cancel"
  ),
  SEED_ADMIN_NAME: z.string().default("Platform Admin"),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@devassess.com"),
  SEED_ADMIN_PASSWORD: z.string().min(8).default("Admin123!"),
  SEED_REVIEWER_NAME: z.string().default("Demo Reviewer"),
  SEED_REVIEWER_EMAIL: z.string().email().default("reviewer@devassess.com"),
  SEED_REVIEWER_PASSWORD: z.string().min(8).default("Reviewer123!"),
  SEED_CANDIDATE_NAME: z.string().default("Demo Candidate"),
  SEED_CANDIDATE_EMAIL: z.string().email().default("candidate@devassess.com"),
  SEED_CANDIDATE_PASSWORD: z.string().min(8).default("Candidate123!"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment configuration");
}

export const config = parsed.data;
