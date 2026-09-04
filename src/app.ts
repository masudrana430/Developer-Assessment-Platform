import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import swaggerSpec from "./config/swagger";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { notFound } from "./middleware/notFound";
import { apiLimiter } from "./middleware/rateLimiter";
import { webhook as stripeWebhook } from "./modules/payments/payment.controller";
import { apiRouter } from "./routes";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin:
      config.FRONTEND_URL === "*"
        ? true
        : config.FRONTEND_URL.split(",").map((origin) => origin.trim()),
    credentials: true,
  }),
);

// Stripe requires the exact raw request body for signature verification.
// This route MUST be registered before express.json().
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/api", apiLimiter);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Developer Assessment Platform API",
    data: {
      version: "v1",
      docs: "Import postman/Developer-Assessment-Platform.postman_collection.json",
    },
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    data: { uptime: process.uptime() },
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

app.get("/api-docs.json", (_req, res) => {
  res.status(200).json(swaggerSpec);
});

app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(globalErrorHandler);
