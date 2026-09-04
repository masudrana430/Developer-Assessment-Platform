import swaggerJsdoc from "swagger-jsdoc";

type Spec = Record<string, unknown>;

const ref = (name: string): Spec => ({ $ref: `#/components/schemas/${name}` });
const paramRef = (name: string): Spec => ({ $ref: `#/components/parameters/${name}` });
const bearerAuth = [{ bearerAuth: [] }];

const errorText: Record<number, string> = {
  400: "The request failed validation or could not be processed.",
  401: "Authentication is required or the bearer token is invalid.",
  403: "The authenticated user is not allowed to perform this operation.",
  404: "The requested resource was not found.",
  409: "The request conflicts with the current resource state.",
  429: "Too many requests. Retry after the rate-limit window.",
  500: "An unexpected server error occurred.",
  503: "A required external integration is unavailable or not configured.",
};

const errorResponses = (...codes: number[]): Record<string, Spec> =>
  Object.fromEntries(
    codes.map((code) => [
      String(code),
      {
        description: errorText[code],
        content: {
          "application/json": {
            schema: ref(code === 400 ? "ValidationErrorResponse" : "ErrorResponse"),
          },
        },
      },
    ]),
  );

const success = (description: string, data: Spec): Spec => ({
  description,
  content: {
    "application/json": {
      schema: {
        allOf: [
          ref("SuccessResponse"),
          { type: "object", required: ["data"], properties: { data } },
        ],
      },
    },
  },
});

const paginated = (description: string, items: Spec): Spec => ({
  description,
  content: {
    "application/json": {
      schema: {
        allOf: [
          ref("SuccessResponse"),
          {
            type: "object",
            required: ["data", "meta"],
            properties: {
              data: { type: "array", items },
              meta: ref("Pagination"),
            },
          },
        ],
      },
    },
  },
});

const jsonBody = (schema: Spec): Spec => ({
  required: true,
  content: { "application/json": { schema } },
});

const uuid = (name: string, description?: string): Spec => ({
  name,
  in: "path",
  required: true,
  description: description ?? `${name} UUID.`,
  schema: { type: "string", format: "uuid" },
});

const nil = { type: "object", nullable: true, example: null };

const definition = {
  openapi: "3.0.3",
  info: {
    title: "Developer Assessment Platform API",
    version: "1.0.0",
    description:
      "Backend API for a paid developer assessment platform with Candidate, Reviewer and Admin roles, Stripe Checkout payments, assessment execution, reviewer evaluation and administrative audit logging.",
  },
  servers: [
    {
      url: "https://developer-assessment-platform.onrender.com/api/v1",
      description: "Production API",
    },
    {
      url: "http://localhost:5000/api/v1",
      description: "Local development API",
    },
  ],
  tags: [
    { name: "Authentication", description: "Registration, login and token lifecycle." },
    { name: "Users", description: "Authenticated user profile operations." },
    { name: "Assessments", description: "Assessment discovery and management." },
    { name: "Questions", description: "Privileged question authoring." },
    { name: "Attempts", description: "Candidate enrollment and execution." },
    { name: "Payments", description: "Stripe payment and checkout operations." },
    { name: "Reviews", description: "Reviewer queue and evaluation workflow." },
    { name: "Admin", description: "Administration, statistics and audit logging." },
    { name: "System", description: "Public service metadata and health checks." },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "An active access token in the Authorization header.",
      },
    },
    parameters: {
      Page: {
        name: "page",
        in: "query",
        description: "One-based page number.",
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      Limit10: {
        name: "limit",
        in: "query",
        description: "Maximum number of results.",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
      },
      Limit20: {
        name: "limit",
        in: "query",
        description: "Maximum number of audit logs.",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation completed successfully" },
          data: {},
          meta: ref("Pagination"),
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "message", "errors"],
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Something went wrong" },
          errors: { type: "array", items: { type: "object", additionalProperties: true } },
        },
      },
      ValidationErrorResponse: {
        allOf: [
          ref("ErrorResponse"),
          {
            type: "object",
            properties: {
              message: { type: "string", example: "Validation failed" },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  required: ["path", "message"],
                  properties: {
                    path: { type: "string", example: "body.email" },
                    message: { type: "string", example: "Invalid email address" },
                  },
                },
              },
            },
          },
        ],
      },
      Pagination: {
        type: "object",
        required: ["page", "limit", "total", "totalPages"],
        properties: {
          page: { type: "integer", minimum: 1, example: 1 },
          limit: { type: "integer", minimum: 1, example: 10 },
          total: { type: "integer", minimum: 0, example: 25 },
          totalPages: { type: "integer", minimum: 0, example: 3 },
        },
      },
      Role: { type: "string", enum: ["CANDIDATE", "REVIEWER", "ADMIN"] },
      UserStatus: { type: "string", enum: ["ACTIVE", "BLOCKED"] },
      AssessmentStatus: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
      Difficulty: { type: "string", enum: ["JUNIOR", "MID", "SENIOR"] },
      QuestionType: { type: "string", enum: ["MCQ", "TEXT", "CODE"] },
      AttemptStatus: {
        type: "string",
        enum: [
          "PENDING_PAYMENT",
          "READY",
          "IN_PROGRESS",
          "SUBMITTED",
          "UNDER_REVIEW",
          "EVALUATED",
          "CANCELLED",
        ],
      },
      PaymentStatus: {
        type: "string",
        enum: ["PENDING", "REQUIRES_ACTION", "SUCCEEDED", "FAILED", "CANCELLED"],
      },
      ReviewDecision: { type: "string", enum: ["PASS", "FAIL"] },
      JsonValue: {
        description: "A JSON scalar, object or array.",
        oneOf: [
          { type: "string" },
          { type: "number" },
          { type: "boolean" },
          { type: "array", items: {} },
          { type: "object", additionalProperties: true },
        ],
      },
      User: {
        type: "object",
        description:
          "Safe user representation; password, Google ID and token version are never exposed.",
        required: ["id", "name", "email", "role", "status", "avatarUrl", "createdAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Taylor Candidate" },
          email: { type: "string", format: "email", example: "candidate@example.com" },
          role: ref("Role"),
          status: ref("UserStatus"),
          avatarUrl: { type: "string", format: "uri", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Profile: {
        allOf: [
          ref("User"),
          {
            type: "object",
            required: ["updatedAt"],
            properties: { updatedAt: { type: "string", format: "date-time" } },
          },
        ],
      },
      AdminUser: {
        type: "object",
        required: ["id", "name", "email", "role", "status"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: ref("Role"),
          status: ref("UserStatus"),
          avatarUrl: { type: "string", format: "uri", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80, example: "Taylor Candidate" },
          email: { type: "string", format: "email", example: "candidate@example.com" },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 72,
            pattern: "(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).+",
            example: "Candidate123!",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "candidate@example.com" },
          password: { type: "string", format: "password", minLength: 1, example: "Candidate123!" },
        },
      },
      GoogleLoginRequest: {
        type: "object",
        required: ["credential"],
        properties: {
          credential: { type: "string", minLength: 20, description: "Google ID token." },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: { refreshToken: { type: "string", minLength: 20 } },
      },
      TokenPair: {
        type: "object",
        required: ["accessToken", "refreshToken"],
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      AuthSession: {
        allOf: [
          ref("TokenPair"),
          { type: "object", required: ["user"], properties: { user: ref("User") } },
        ],
      },
      UpdateProfileRequest: {
        type: "object",
        minProperties: 1,
        properties: { name: { type: "string", minLength: 2, maxLength: 80 } },
      },
      Assessment: {
        type: "object",
        description: "Public assessment representation. It has no questions or answer keys.",
        required: [
          "id",
          "title",
          "slug",
          "description",
          "difficulty",
          "durationMinutes",
          "passingScore",
          "feeCents",
          "currency",
          "status",
          "createdAt",
          "creator",
          "_count",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", example: "Backend TypeScript Assessment" },
          slug: { type: "string", example: "backend-typescript-assessment" },
          description: { type: "string", example: "A practical backend engineering assessment." },
          difficulty: ref("Difficulty"),
          durationMinutes: { type: "integer", minimum: 5, maximum: 480, example: 60 },
          passingScore: { type: "number", minimum: 0, maximum: 100, example: 70 },
          feeCents: { type: "integer", minimum: 0, example: 1000 },
          currency: { type: "string", minLength: 3, maxLength: 3, example: "usd" },
          status: ref("AssessmentStatus"),
          createdAt: { type: "string", format: "date-time" },
          creator: {
            type: "object",
            required: ["id", "name"],
            properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } },
          },
          _count: {
            type: "object",
            required: ["questions"],
            properties: { questions: { type: "integer", minimum: 0 } },
          },
        },
      },
      AssessmentInput: {
        type: "object",
        required: ["title", "slug", "description", "difficulty", "durationMinutes", "passingScore"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 150 },
          slug: {
            type: "string",
            minLength: 3,
            maxLength: 100,
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          },
          description: { type: "string", minLength: 20, maxLength: 5000 },
          difficulty: ref("Difficulty"),
          durationMinutes: { type: "integer", minimum: 5, maximum: 480 },
          passingScore: { type: "number", minimum: 0, maximum: 100 },
          feeCents: { type: "integer", minimum: 0, maximum: 10000000, default: 0 },
          currency: { type: "string", minLength: 3, maxLength: 3, default: "usd" },
        },
      },
      AssessmentUpdateInput: {
        type: "object",
        minProperties: 1,
        description: "At least one field is required; rules match assessment creation.",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 150 },
          slug: {
            type: "string",
            minLength: 3,
            maxLength: 100,
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          },
          description: { type: "string", minLength: 20, maxLength: 5000 },
          difficulty: ref("Difficulty"),
          durationMinutes: { type: "integer", minimum: 5, maximum: 480 },
          passingScore: { type: "number", minimum: 0, maximum: 100 },
          feeCents: { type: "integer", minimum: 0, maximum: 10000000 },
          currency: { type: "string", minLength: 3, maxLength: 3 },
        },
      },
      Question: {
        type: "object",
        description:
          "Candidate-safe question. It deliberately never contains a correctAnswer property.",
        required: ["id", "prompt", "type", "options", "points", "order"],
        properties: {
          id: { type: "string", format: "uuid" },
          prompt: { type: "string" },
          type: ref("QuestionType"),
          options: { type: "array", nullable: true, items: { type: "string" } },
          points: { type: "integer", minimum: 1, maximum: 100 },
          order: { type: "integer", minimum: 1, maximum: 1000 },
        },
      },
      ManagedQuestion: {
        allOf: [
          ref("Question"),
          {
            type: "object",
            description: "Reviewer/admin-only question representation with the answer key.",
            required: ["assessmentId", "correctAnswer", "deletedAt", "createdAt", "updatedAt"],
            properties: {
              assessmentId: { type: "string", format: "uuid" },
              correctAnswer: { allOf: [ref("JsonValue")], nullable: true },
              deletedAt: { type: "string", format: "date-time", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      QuestionInput: {
        type: "object",
        required: ["prompt", "type", "points", "order"],
        properties: {
          prompt: { type: "string", minLength: 3, maxLength: 10000 },
          type: ref("QuestionType"),
          options: {
            type: "array",
            minItems: 2,
            maxItems: 10,
            items: { type: "string", minLength: 1 },
          },
          correctAnswer: {
            type: "string",
            minLength: 1,
            description: "Required for MCQ and must match an option.",
          },
          points: { type: "integer", minimum: 1, maximum: 100 },
          order: { type: "integer", minimum: 1, maximum: 1000 },
        },
      },
      QuestionUpdateInput: {
        type: "object",
        description:
          "All fields are optional. The merged MCQ must still have two options and a matching correct answer.",
        properties: {
          prompt: { type: "string", minLength: 3, maxLength: 10000 },
          type: ref("QuestionType"),
          options: {
            type: "array",
            nullable: true,
            minItems: 2,
            maxItems: 10,
            items: { type: "string", minLength: 1 },
          },
          correctAnswer: { allOf: [ref("JsonValue")], nullable: true },
          points: { type: "integer", minimum: 1, maximum: 100 },
          order: { type: "integer", minimum: 1, maximum: 1000 },
        },
      },
      ManagedAssessment: {
        type: "object",
        description: "Reviewer/admin-only assessment detail including answer keys.",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          difficulty: ref("Difficulty"),
          durationMinutes: { type: "integer" },
          passingScore: { type: "number" },
          feeCents: { type: "integer" },
          currency: { type: "string" },
          status: ref("AssessmentStatus"),
          createdById: { type: "string", format: "uuid" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          questions: { type: "array", items: ref("ManagedQuestion") },
          _count: {
            type: "object",
            properties: { attempts: { type: "integer", minimum: 0 } },
          },
        },
      },
      Attempt: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          assessmentId: { type: "string", format: "uuid" },
          candidateId: { type: "string", format: "uuid" },
          reviewerId: { type: "string", format: "uuid", nullable: true },
          attemptNo: { type: "integer", minimum: 1 },
          status: ref("AttemptStatus"),
          startedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          submittedAt: { type: "string", format: "date-time", nullable: true },
          evaluatedAt: { type: "string", format: "date-time", nullable: true },
          autoScore: { type: "number", nullable: true },
          finalScore: { type: "number", nullable: true },
          passed: { type: "boolean", nullable: true },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Answer: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          attemptId: { type: "string", format: "uuid" },
          questionId: { type: "string", format: "uuid" },
          response: ref("JsonValue"),
          autoScore: { type: "number", nullable: true },
          reviewerScore: { type: "number", nullable: true },
          feedback: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          attemptId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          stripePaymentIntentId: { type: "string", nullable: true },
          stripeCheckoutSessionId: { type: "string", nullable: true },
          amountCents: { type: "integer", minimum: 0 },
          currency: { type: "string" },
          status: ref("PaymentStatus"),
          failureReason: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          attemptId: { type: "string", format: "uuid" },
          reviewerId: { type: "string", format: "uuid" },
          feedback: { type: "string" },
          decision: ref("ReviewDecision"),
          totalScore: { type: "number", minimum: 0, maximum: 100 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          actorId: { type: "string", format: "uuid", nullable: true },
          action: { type: "string" },
          entityType: { type: "string" },
          entityId: { type: "string", format: "uuid", nullable: true },
          metadata: { allOf: [ref("JsonValue")], nullable: true },
          createdAt: { type: "string", format: "date-time" },
          actor: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              role: ref("Role"),
            },
          },
        },
      },
      AttemptEnrollment: {
        allOf: [
          ref("Attempt"),
          {
            type: "object",
            properties: {
              assessment: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  feeCents: { type: "integer" },
                  currency: { type: "string" },
                  durationMinutes: { type: "integer" },
                },
              },
            },
          },
        ],
      },
      AttemptSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          attemptNo: { type: "integer" },
          status: ref("AttemptStatus"),
          startedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          submittedAt: { type: "string", format: "date-time", nullable: true },
          evaluatedAt: { type: "string", format: "date-time", nullable: true },
          finalScore: { type: "number", nullable: true },
          passed: { type: "boolean", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          assessment: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string" },
              slug: { type: "string" },
              difficulty: ref("Difficulty"),
            },
          },
          payment: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string", format: "uuid" },
              status: ref("PaymentStatus"),
              amountCents: { type: "integer" },
              currency: { type: "string" },
            },
          },
        },
      },
      CandidateAttempt: {
        type: "object",
        description:
          "Candidate-owned attempt. Started questions are public and have no correctAnswer.",
        properties: {
          id: { type: "string", format: "uuid" },
          attemptNo: { type: "integer" },
          status: ref("AttemptStatus"),
          startedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          submittedAt: { type: "string", format: "date-time", nullable: true },
          evaluatedAt: { type: "string", format: "date-time", nullable: true },
          autoScore: { type: "number", nullable: true },
          finalScore: { type: "number", nullable: true },
          passed: { type: "boolean", nullable: true },
          assessment: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string" },
              passingScore: { type: "number" },
              durationMinutes: { type: "integer" },
              feeCents: { type: "integer" },
              currency: { type: "string" },
              questions: {
                type: "array",
                items: {
                  allOf: [
                    ref("Question"),
                    {
                      type: "object",
                      properties: { answers: { type: "array", items: ref("Answer") } },
                    },
                  ],
                },
              },
            },
          },
          payment: { allOf: [ref("Payment")], nullable: true },
          review: {
            type: "object",
            nullable: true,
            properties: {
              feedback: { type: "string" },
              decision: ref("ReviewDecision"),
              totalScore: { type: "number" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      StartedAttempt: {
        allOf: [
          ref("Attempt"),
          {
            type: "object",
            properties: {
              assessment: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  durationMinutes: { type: "integer" },
                  passingScore: { type: "number" },
                  questions: { type: "array", items: ref("Question") },
                },
              },
            },
          },
        ],
      },
      SavedAnswer: {
        type: "object",
        required: ["id", "questionId", "response", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          questionId: { type: "string", format: "uuid" },
          response: ref("JsonValue"),
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AnswerInput: {
        type: "object",
        required: ["response"],
        properties: {
          response: {
            allOf: [ref("JsonValue")],
            description: "Any JSON value except null or undefined.",
          },
        },
      },
      PaymentInitiation: {
        type: "object",
        properties: {
          payment: { allOf: [ref("Payment")], nullable: true },
          clientSecret: { type: "string", nullable: true },
          stripeStatus: { type: "string" },
        },
      },
      PaymentConfirmation: {
        type: "object",
        properties: {
          payment: { allOf: [ref("Payment")], nullable: true },
          clientSecret: { type: "string", nullable: true },
          stripeStatus: { type: "string" },
        },
      },
      InitiatePaymentRequest: {
        type: "object",
        properties: {
          paymentMethodId: {
            type: "string",
            minLength: 3,
            description: "Optional Stripe payment method ID.",
          },
        },
      },
      ConfirmPaymentRequest: {
        type: "object",
        required: ["paymentMethodId"],
        properties: { paymentMethodId: { type: "string", minLength: 3 } },
      },
      CheckoutSession: {
        type: "object",
        properties: {
          paymentId: { type: "string", format: "uuid" },
          sessionId: { type: "string" },
          checkoutUrl: { type: "string", format: "uri", nullable: true },
        },
      },
      PaymentWithAttempt: {
        allOf: [
          ref("Payment"),
          {
            type: "object",
            properties: {
              attempt: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  candidateId: { type: "string", format: "uuid" },
                  assessment: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      title: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      ReviewQueueItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          submittedAt: { type: "string", format: "date-time", nullable: true },
          attemptNo: { type: "integer" },
          assessment: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string" },
              difficulty: ref("Difficulty"),
            },
          },
          candidate: {
            type: "object",
            properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } },
          },
        },
      },
      AssignedReviewItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          status: ref("AttemptStatus"),
          submittedAt: { type: "string", format: "date-time", nullable: true },
          evaluatedAt: { type: "string", format: "date-time", nullable: true },
          finalScore: { type: "number", nullable: true },
          passed: { type: "boolean", nullable: true },
          assessment: {
            type: "object",
            properties: { id: { type: "string", format: "uuid" }, title: { type: "string" } },
          },
          candidate: {
            type: "object",
            properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } },
          },
        },
      },
      ReviewAttempt: {
        type: "object",
        description: "Reviewer-only response with correct answers and candidate email.",
        properties: {
          id: { type: "string", format: "uuid" },
          status: ref("AttemptStatus"),
          autoScore: { type: "number", nullable: true },
          finalScore: { type: "number", nullable: true },
          passed: { type: "boolean", nullable: true },
          assessment: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string" },
              passingScore: { type: "number" },
              questions: {
                type: "array",
                items: {
                  allOf: [
                    ref("ManagedQuestion"),
                    {
                      type: "object",
                      properties: { answers: { type: "array", items: ref("Answer") } },
                    },
                  ],
                },
              },
            },
          },
          candidate: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
            },
          },
          review: { allOf: [ref("Review")], nullable: true },
        },
      },
      EvaluateReviewRequest: {
        type: "object",
        required: ["feedback"],
        properties: {
          feedback: { type: "string", minLength: 3, maxLength: 5000 },
          answers: {
            type: "array",
            default: [],
            items: {
              type: "object",
              required: ["answerId", "score"],
              properties: {
                answerId: { type: "string", format: "uuid" },
                score: { type: "number", minimum: 0 },
                feedback: { type: "string", maxLength: 2000 },
              },
            },
          },
        },
      },
      AdminStats: {
        type: "object",
        properties: {
          users: {
            type: "object",
            properties: {
              total: { type: "integer", minimum: 0 },
              candidates: { type: "integer", minimum: 0 },
              reviewers: { type: "integer", minimum: 0 },
            },
          },
          assessments: {
            type: "object",
            properties: { published: { type: "integer", minimum: 0 } },
          },
          attempts: {
            type: "object",
            properties: {
              total: { type: "integer", minimum: 0 },
              evaluated: { type: "integer", minimum: 0 },
            },
          },
          payments: {
            type: "object",
            properties: {
              successfulCount: { type: "integer", minimum: 0 },
              grossAmountInMinorUnits: { type: "integer", minimum: 0 },
            },
          },
        },
      },
      WebhookAcknowledgement: {
        type: "object",
        required: ["received", "eventType"],
        properties: {
          received: { type: "boolean", example: true },
          eventType: { type: "string", example: "checkout.session.completed" },
        },
      },
      RootInfo: {
        type: "object",
        required: ["version", "docs"],
        properties: { version: { type: "string", example: "v1" }, docs: { type: "string" } },
      },
      HealthStatus: {
        type: "object",
        required: ["uptime"],
        properties: { uptime: { type: "number", minimum: 0 } },
      },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["System"],
        operationId: "getApiInfo",
        summary: "Get API metadata",
        description: "This endpoint is served at the host root, not below the API version prefix.",
        servers: [
          { url: "https://developer-assessment-platform.onrender.com" },
          { url: "http://localhost:5000" },
        ],
        responses: {
          200: success("API metadata retrieved successfully.", ref("RootInfo")),
          ...errorResponses(500),
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        operationId: "getHealth",
        summary: "Get service health",
        description: "This endpoint is served at the host root, not below the API version prefix.",
        servers: [
          { url: "https://developer-assessment-platform.onrender.com" },
          { url: "http://localhost:5000" },
        ],
        responses: {
          200: success("API is healthy.", ref("HealthStatus")),
          ...errorResponses(500),
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        operationId: "registerCandidate",
        summary: "Register a candidate",
        description:
          "Public, rate-limited endpoint. Registration always creates a CANDIDATE account.",
        requestBody: jsonBody(ref("RegisterRequest")),
        responses: {
          201: success("Candidate registered successfully.", ref("AuthSession")),
          ...errorResponses(400, 409, 429, 500),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        operationId: "login",
        summary: "Log in with email and password",
        description: "Public, rate-limited endpoint for Candidate, Reviewer and Admin accounts.",
        requestBody: jsonBody(ref("LoginRequest")),
        responses: {
          200: success("Login successful.", ref("AuthSession")),
          ...errorResponses(400, 401, 403, 429, 500),
        },
      },
    },
    "/auth/google": {
      post: {
        tags: ["Authentication"],
        operationId: "googleLogin",
        summary: "Log in with a Google ID token",
        description: "Public, rate-limited endpoint. New Google accounts are candidates.",
        requestBody: jsonBody(ref("GoogleLoginRequest")),
        responses: {
          200: success("Google login successful.", ref("AuthSession")),
          ...errorResponses(400, 401, 403, 429, 500, 503),
        },
      },
    },
    "/auth/refresh-token": {
      post: {
        tags: ["Authentication"],
        operationId: "refreshAccessToken",
        summary: "Rotate a refresh token",
        description: "Public, rate-limited endpoint.",
        requestBody: jsonBody(ref("RefreshTokenRequest")),
        responses: {
          200: success("Token refreshed successfully.", ref("TokenPair")),
          ...errorResponses(400, 401, 429, 500),
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        operationId: "logout",
        summary: "Revoke a refresh token family",
        description:
          "Public endpoint requiring a valid refresh token in the body, not a bearer access token.",
        requestBody: jsonBody(ref("RefreshTokenRequest")),
        responses: {
          200: success("Logged out successfully.", nil),
          ...errorResponses(400, 401, 500),
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        operationId: "getMyProfile",
        summary: "Get the authenticated user profile",
        security: bearerAuth,
        responses: {
          200: success("Profile retrieved successfully.", ref("Profile")),
          ...errorResponses(401, 404, 429, 500),
        },
      },
      patch: {
        tags: ["Users"],
        operationId: "updateMyProfile",
        summary: "Update the authenticated user profile",
        security: bearerAuth,
        requestBody: jsonBody(ref("UpdateProfileRequest")),
        responses: {
          200: success("Profile updated successfully.", ref("Profile")),
          ...errorResponses(400, 401, 404, 429, 500),
        },
      },
    },
    "/users/me/avatar": {
      patch: {
        tags: ["Users"],
        operationId: "uploadMyAvatar",
        summary: "Upload a profile image",
        description:
          "Requires an authenticated user. Use profileImage with a JPEG, PNG or WebP file no larger than 2 MiB.",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["profileImage"],
                properties: { profileImage: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          200: success("Profile image updated successfully.", ref("Profile")),
          ...errorResponses(400, 401, 404, 429, 500, 503),
        },
      },
    },
    "/assessments": {
      get: {
        tags: ["Assessments"],
        operationId: "listPublishedAssessments",
        summary: "List published assessments",
        description:
          "Public endpoint. Only non-deleted PUBLISHED assessments are returned and no answer key is included.",
        parameters: [
          paramRef("Page"),
          paramRef("Limit10"),
          { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
          { name: "difficulty", in: "query", schema: ref("Difficulty") },
          {
            name: "sortBy",
            in: "query",
            schema: {
              type: "string",
              enum: ["createdAt", "title", "feeCents", "durationMinutes"],
              default: "createdAt",
            },
          },
          {
            name: "sortOrder",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        ],
        responses: {
          200: paginated("Published assessments retrieved successfully.", ref("Assessment")),
          ...errorResponses(400, 429, 500),
        },
      },
      post: {
        tags: ["Assessments"],
        operationId: "createAssessment",
        summary: "Create a draft assessment",
        description: "Requires a REVIEWER or ADMIN bearer token.",
        security: bearerAuth,
        requestBody: jsonBody(ref("AssessmentInput")),
        responses: {
          201: success("Assessment created successfully.", ref("Assessment")),
          ...errorResponses(400, 401, 403, 409, 429, 500),
        },
      },
    },
    "/assessments/{id}": {
      get: {
        tags: ["Assessments"],
        operationId: "getPublishedAssessment",
        summary: "Get a published assessment",
        description:
          "Public endpoint. Only non-deleted PUBLISHED records are available and no answer key is returned.",
        parameters: [uuid("id", "Published assessment UUID.")],
        responses: {
          200: success("Assessment retrieved successfully.", ref("Assessment")),
          ...errorResponses(400, 404, 429, 500),
        },
      },
      patch: {
        tags: ["Assessments"],
        operationId: "updateAssessment",
        summary: "Update an assessment",
        description: "Requires the owning REVIEWER or an ADMIN bearer token.",
        security: bearerAuth,
        parameters: [uuid("id", "Assessment UUID.")],
        requestBody: jsonBody(ref("AssessmentUpdateInput")),
        responses: {
          200: success("Assessment updated successfully.", ref("Assessment")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
      delete: {
        tags: ["Assessments"],
        operationId: "deleteAssessment",
        summary: "Soft-delete an assessment",
        description:
          "Requires the owning REVIEWER or ADMIN. The assessment is archived and soft-deleted.",
        security: bearerAuth,
        parameters: [uuid("id", "Assessment UUID.")],
        responses: {
          200: success("Assessment deleted successfully.", nil),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/assessments/manage/mine": {
      get: {
        tags: ["Assessments"],
        operationId: "listManagedAssessments",
        summary: "List assessments managed by the current user",
        description:
          "Requires REVIEWER or ADMIN. Reviewers see their own active assessments; admins see all active assessments.",
        security: bearerAuth,
        parameters: [
          paramRef("Page"),
          paramRef("Limit10"),
          { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
          { name: "status", in: "query", schema: ref("AssessmentStatus") },
        ],
        responses: {
          200: paginated("Managed assessments retrieved successfully.", ref("Assessment")),
          ...errorResponses(400, 401, 403, 429, 500),
        },
      },
    },
    "/assessments/manage/{id}": {
      get: {
        tags: ["Assessments"],
        operationId: "getManagedAssessment",
        summary: "Get a managed assessment with its answer key",
        description:
          "Requires REVIEWER or ADMIN. This privileged response contains correctAnswer values and must not be used by a candidate client.",
        security: bearerAuth,
        parameters: [uuid("id", "Assessment UUID.")],
        responses: {
          200: success("Managed assessment retrieved successfully.", ref("ManagedAssessment")),
          ...errorResponses(400, 401, 403, 404, 429, 500),
        },
      },
    },
    "/assessments/{id}/publish": {
      patch: {
        tags: ["Assessments"],
        operationId: "publishAssessment",
        summary: "Publish an assessment",
        description:
          "Requires the owning REVIEWER or ADMIN. Active questions and a positive total point value are required.",
        security: bearerAuth,
        parameters: [uuid("id", "Assessment UUID.")],
        responses: {
          200: success("Assessment published successfully.", ref("Assessment")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/assessments/{id}/questions": {
      post: {
        tags: ["Questions"],
        operationId: "addQuestion",
        summary: "Add a question",
        description:
          "Requires the owning REVIEWER or ADMIN. The privileged response includes the correct answer.",
        security: bearerAuth,
        parameters: [uuid("id", "Assessment UUID.")],
        requestBody: jsonBody(ref("QuestionInput")),
        responses: {
          201: success("Question added successfully.", ref("ManagedQuestion")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/assessments/{id}/questions/{questionId}": {
      patch: {
        tags: ["Questions"],
        operationId: "updateQuestion",
        summary: "Update a question",
        description:
          "Requires the owning REVIEWER or ADMIN. The privileged response includes the correct answer.",
        security: bearerAuth,
        parameters: [uuid("id", "Assessment UUID."), uuid("questionId", "Question UUID.")],
        requestBody: jsonBody(ref("QuestionUpdateInput")),
        responses: {
          200: success("Question updated successfully.", ref("ManagedQuestion")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
      delete: {
        tags: ["Questions"],
        operationId: "deleteQuestion",
        summary: "Soft-delete a question",
        description: "Requires the owning REVIEWER or ADMIN bearer token.",
        security: bearerAuth,
        parameters: [uuid("id", "Assessment UUID."), uuid("questionId", "Question UUID.")],
        responses: {
          200: success("Question deleted successfully.", nil),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/attempts/enroll/{assessmentId}": {
      post: {
        tags: ["Attempts"],
        operationId: "enrollInAssessment",
        summary: "Enroll in an assessment",
        description:
          "Requires CANDIDATE. Paid assessments create PENDING_PAYMENT; free assessments create READY.",
        security: bearerAuth,
        parameters: [uuid("assessmentId", "Published assessment UUID.")],
        responses: {
          201: success("Enrollment created successfully.", ref("AttemptEnrollment")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/attempts/my": {
      get: {
        tags: ["Attempts"],
        operationId: "listMyAttempts",
        summary: "List the candidate's attempts",
        description: "Requires a CANDIDATE bearer token.",
        security: bearerAuth,
        parameters: [
          paramRef("Page"),
          paramRef("Limit10"),
          { name: "status", in: "query", schema: ref("AttemptStatus") },
        ],
        responses: {
          200: paginated("Attempts retrieved successfully.", ref("AttemptSummary")),
          ...errorResponses(400, 401, 403, 429, 500),
        },
      },
    },
    "/attempts/{attemptId}": {
      get: {
        tags: ["Attempts"],
        operationId: "getMyAttempt",
        summary: "Get a candidate-owned attempt",
        description:
          "Requires CANDIDATE. Started attempts contain public questions and saved answers, but never correctAnswer.",
        security: bearerAuth,
        parameters: [uuid("attemptId", "Attempt UUID.")],
        responses: {
          200: success("Attempt retrieved successfully.", ref("CandidateAttempt")),
          ...errorResponses(400, 401, 403, 404, 429, 500),
        },
      },
    },
    "/attempts/{attemptId}/start": {
      post: {
        tags: ["Attempts"],
        operationId: "startAttempt",
        summary: "Start an assessment attempt",
        description:
          "Requires CANDIDATE. The first start includes public questions; an already in-progress attempt returns its existing shape.",
        security: bearerAuth,
        parameters: [uuid("attemptId", "Attempt UUID.")],
        responses: {
          200: success("Assessment attempt started.", ref("StartedAttempt")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/attempts/{attemptId}/answers/{questionId}": {
      put: {
        tags: ["Attempts"],
        operationId: "saveAttemptAnswer",
        summary: "Save or replace an answer",
        description:
          "Requires CANDIDATE. The attempt must be in progress and the question must belong to its assessment.",
        security: bearerAuth,
        parameters: [uuid("attemptId", "Attempt UUID."), uuid("questionId", "Question UUID.")],
        requestBody: jsonBody(ref("AnswerInput")),
        responses: {
          200: success("Answer saved successfully.", ref("SavedAnswer")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/attempts/{attemptId}/submit": {
      post: {
        tags: ["Attempts"],
        operationId: "submitAttempt",
        summary: "Submit an in-progress attempt",
        description: "Requires CANDIDATE. Answers are not required for every question.",
        security: bearerAuth,
        parameters: [uuid("attemptId", "Attempt UUID.")],
        responses: {
          200: success("Attempt submitted successfully.", {
            type: "object",
            required: ["id", "status", "submittedAt", "autoScore"],
            properties: {
              id: { type: "string", format: "uuid" },
              status: ref("AttemptStatus"),
              submittedAt: { type: "string", format: "date-time", nullable: true },
              autoScore: { type: "number", nullable: true },
            },
          }),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/payments/attempts/{attemptId}/initiate": {
      post: {
        tags: ["Payments"],
        operationId: "initiatePayment",
        summary: "Create or initiate a Stripe PaymentIntent",
        description: "Requires CANDIDATE ownership of a paid attempt in a payable state.",
        security: bearerAuth,
        parameters: [uuid("attemptId", "Attempt UUID.")],
        requestBody: jsonBody(ref("InitiatePaymentRequest")),
        responses: {
          201: success("Payment initiated successfully.", ref("PaymentInitiation")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500, 503),
        },
      },
    },
    "/payments/{paymentId}/confirm": {
      post: {
        tags: ["Payments"],
        operationId: "confirmPayment",
        summary: "Confirm a Stripe PaymentIntent",
        description:
          "Requires CANDIDATE ownership. An already-succeeded payment returns a Payment value directly.",
        security: bearerAuth,
        parameters: [uuid("paymentId", "Payment UUID.")],
        requestBody: jsonBody(ref("ConfirmPaymentRequest")),
        responses: {
          200: success("Payment confirmation processed.", {
            oneOf: [ref("Payment"), ref("PaymentConfirmation")],
          }),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500, 503),
        },
      },
    },
    "/payments/attempts/{attemptId}": {
      get: {
        tags: ["Payments"],
        operationId: "getPaymentByAttempt",
        summary: "Get a payment by candidate-owned attempt",
        description: "Requires CANDIDATE ownership.",
        security: bearerAuth,
        parameters: [uuid("attemptId", "Attempt UUID.")],
        responses: {
          200: success("Payment retrieved successfully.", ref("Payment")),
          ...errorResponses(400, 401, 403, 404, 429, 500),
        },
      },
    },
    "/payments/{paymentId}": {
      get: {
        tags: ["Payments"],
        operationId: "getPaymentById",
        summary: "Get a payment by ID",
        description: "Requires CANDIDATE ownership or an ADMIN bearer token.",
        security: bearerAuth,
        parameters: [uuid("paymentId", "Payment UUID.")],
        responses: {
          200: success("Payment retrieved successfully.", ref("PaymentWithAttempt")),
          ...errorResponses(400, 401, 403, 404, 429, 500),
        },
      },
    },
    "/payments/attempts/{attemptId}/checkout": {
      post: {
        tags: ["Payments"],
        operationId: "createCheckoutSession",
        summary: "Create a Stripe Checkout session",
        description:
          "Requires CANDIDATE ownership. Open checkoutUrl in a browser; the signed webhook updates payment status.",
        security: bearerAuth,
        parameters: [uuid("attemptId", "Attempt UUID.")],
        responses: {
          201: success("Checkout session created successfully.", ref("CheckoutSession")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500, 503),
        },
      },
    },
    "/payments/checkout/success": {
      get: {
        tags: ["Payments"],
        operationId: "checkoutSuccess",
        summary: "Render the successful Checkout return page",
        description: "Public Stripe return URL. The response is HTML.",
        parameters: [
          {
            name: "session_id",
            in: "query",
            required: true,
            description: "Stripe Checkout Session ID.",
            schema: { type: "string", minLength: 1, example: "cs_test_..." },
          },
        ],
        responses: {
          200: {
            description: "Payment success HTML page.",
            content: { "text/html": { schema: { type: "string" } } },
          },
          ...errorResponses(400, 429, 500, 503),
        },
      },
    },
    "/payments/checkout/cancel": {
      get: {
        tags: ["Payments"],
        operationId: "checkoutCancel",
        summary: "Render the cancelled Checkout return page",
        description: "Public Stripe cancellation return URL. The response is HTML.",
        responses: {
          200: {
            description: "Payment cancellation HTML page.",
            content: { "text/html": { schema: { type: "string" } } },
          },
          ...errorResponses(429, 500),
        },
      },
    },
    "/payments/webhook": {
      post: {
        tags: ["Payments"],
        operationId: "stripeWebhook",
        summary: "Receive Stripe webhook events",
        description:
          "Public Stripe-only endpoint. Send the exact unparsed raw application/json event body with the Stripe-Signature header. No bearer token is used. The endpoint runs before express.json so signature verification remains valid.",
        parameters: [
          {
            name: "Stripe-Signature",
            in: "header",
            required: true,
            description: "Stripe signature calculated over the untouched raw request body.",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          description: "Raw Stripe event body. Do not reserialize or modify this payload.",
          content: {
            "application/json": { schema: { type: "string", format: "binary" } },
          },
        },
        responses: {
          200: success("Webhook processed successfully.", ref("WebhookAcknowledgement")),
          ...errorResponses(400, 500, 503),
        },
      },
    },
    "/reviews/queue": {
      get: {
        tags: ["Reviews"],
        operationId: "getReviewQueue",
        summary: "List unclaimed submissions",
        description: "Requires REVIEWER. Administrators are not authorized for reviewer routes.",
        security: bearerAuth,
        parameters: [paramRef("Page"), paramRef("Limit10")],
        responses: {
          200: paginated("Review queue retrieved successfully.", ref("ReviewQueueItem")),
          ...errorResponses(400, 401, 403, 429, 500),
        },
      },
    },
    "/reviews/mine": {
      get: {
        tags: ["Reviews"],
        operationId: "getMyReviews",
        summary: "List submissions assigned to the reviewer",
        description: "Requires REVIEWER.",
        security: bearerAuth,
        parameters: [paramRef("Page"), paramRef("Limit10")],
        responses: {
          200: paginated("Assigned reviews retrieved successfully.", ref("AssignedReviewItem")),
          ...errorResponses(400, 401, 403, 429, 500),
        },
      },
    },
    "/reviews/{attemptId}": {
      get: {
        tags: ["Reviews"],
        operationId: "getReviewAttempt",
        summary: "Get a claimed review attempt",
        description:
          "Requires the assigned REVIEWER. This privileged response includes correct answers and candidate email.",
        security: bearerAuth,
        parameters: [uuid("attemptId", "Attempt UUID.")],
        responses: {
          200: success("Review attempt retrieved successfully.", ref("ReviewAttempt")),
          ...errorResponses(400, 401, 403, 404, 429, 500),
        },
      },
    },
    "/reviews/{attemptId}/claim": {
      post: {
        tags: ["Reviews"],
        operationId: "claimReviewAttempt",
        summary: "Claim a submitted attempt",
        description:
          "Requires REVIEWER. Claiming is atomic; claimed or non-reviewable attempts conflict.",
        security: bearerAuth,
        parameters: [uuid("attemptId", "Attempt UUID.")],
        responses: {
          200: success("Attempt claimed successfully.", ref("ReviewAttempt")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/reviews/{attemptId}/evaluate": {
      post: {
        tags: ["Reviews"],
        operationId: "evaluateReviewAttempt",
        summary: "Evaluate a claimed attempt",
        description:
          "Requires the assigned REVIEWER. Only non-MCQ answer scores are applied and a score cannot exceed that question's points.",
        security: bearerAuth,
        parameters: [uuid("attemptId", "Attempt UUID.")],
        requestBody: jsonBody(ref("EvaluateReviewRequest")),
        responses: {
          200: success("Attempt evaluated successfully.", ref("Review")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        operationId: "listUsers",
        summary: "List users",
        description: "Requires ADMIN.",
        security: bearerAuth,
        parameters: [
          paramRef("Page"),
          paramRef("Limit10"),
          { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
          { name: "role", in: "query", schema: ref("Role") },
          { name: "status", in: "query", schema: ref("UserStatus") },
          {
            name: "sortOrder",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        ],
        responses: {
          200: paginated("Users retrieved successfully.", ref("AdminUser")),
          ...errorResponses(400, 401, 403, 429, 500),
        },
      },
    },
    "/admin/users/{userId}/status": {
      patch: {
        tags: ["Admin"],
        operationId: "updateUserStatus",
        summary: "Change a user account status",
        description: "Requires ADMIN. An administrator cannot block their own account.",
        security: bearerAuth,
        parameters: [uuid("userId", "User UUID.")],
        requestBody: jsonBody({
          type: "object",
          required: ["status"],
          properties: { status: ref("UserStatus") },
        }),
        responses: {
          200: success("User status updated successfully.", ref("AdminUser")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/admin/users/{userId}/role": {
      patch: {
        tags: ["Admin"],
        operationId: "updateUserRole",
        summary: "Change a user role",
        description:
          "Requires ADMIN. Self-demotion and role changes that conflict with active work are rejected.",
        security: bearerAuth,
        parameters: [uuid("userId", "User UUID.")],
        requestBody: jsonBody({
          type: "object",
          required: ["role"],
          properties: { role: ref("Role") },
        }),
        responses: {
          200: success("User role updated successfully.", ref("AdminUser")),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/admin/users/{userId}": {
      delete: {
        tags: ["Admin"],
        operationId: "softDeleteUser",
        summary: "Soft-delete a user",
        description:
          "Requires ADMIN. The current administrator and users with active attempts cannot be deleted.",
        security: bearerAuth,
        parameters: [uuid("userId", "User UUID.")],
        responses: {
          200: success("User deleted successfully.", nil),
          ...errorResponses(400, 401, 403, 404, 409, 429, 500),
        },
      },
    },
    "/admin/stats": {
      get: {
        tags: ["Admin"],
        operationId: "getAdminStats",
        summary: "Get dashboard statistics",
        description: "Requires ADMIN.",
        security: bearerAuth,
        responses: {
          200: success("Dashboard statistics retrieved successfully.", ref("AdminStats")),
          ...errorResponses(401, 403, 429, 500),
        },
      },
    },
    "/admin/audit-logs": {
      get: {
        tags: ["Admin"],
        operationId: "listAuditLogs",
        summary: "List audit logs",
        description: "Requires ADMIN.",
        security: bearerAuth,
        parameters: [
          paramRef("Page"),
          paramRef("Limit20"),
          { name: "action", in: "query", schema: { type: "string", maxLength: 100 } },
          { name: "entityType", in: "query", schema: { type: "string", maxLength: 100 } },
        ],
        responses: {
          200: paginated("Audit logs retrieved successfully.", ref("AuditLog")),
          ...errorResponses(400, 401, 403, 429, 500),
        },
      },
    },
  },
};

export default swaggerJsdoc({ definition, apis: [] });
