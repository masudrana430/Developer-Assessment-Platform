import swaggerJsdoc from "swagger-jsdoc";

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Developer Assessment Platform API",
      version: "1.0.0",
      description:
        "Backend API for a paid developer assessment platform with Candidate, Reviewer and Admin roles, Stripe Checkout payments, assessment execution, grading and audit logging.",
    },

    servers: [
      {
        url: "https://developer-assessment-platform.onrender.com/api/v1",
        description: "Production - Render",
      },
      {
        url: "http://localhost:5000/api/v1",
        description: "Local development",
      },
    ],

    tags: [
      {
        name: "Authentication",
        description: "Registration, login and token management",
      },
      {
        name: "Users",
        description: "User profile operations",
      },
      {
        name: "Assessments",
        description: "Assessment and question management",
      },
      {
        name: "Attempts",
        description: "Candidate enrollment and assessment execution",
      },
      {
        name: "Payments",
        description: "Stripe Checkout and payment tracking",
      },
      {
        name: "Reviews",
        description: "Reviewer evaluation workflow",
      },
      {
        name: "Admin",
        description: "Administration, statistics and audit logs",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Something went wrong",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
              },
            },
          },
        },

        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "candidate@devassess.com",
            },
            password: {
              type: "string",
              example: "Candidate123!",
            },
          },
        },

        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              example: "New Candidate",
            },
            email: {
              type: "string",
              format: "email",
              example: "candidate2@example.com",
            },
            password: {
              type: "string",
              example: "Candidate123!",
            },
          },
        },

        AssessmentInput: {
          type: "object",
          required: [
            "title",
            "slug",
            "description",
            "difficulty",
            "durationMinutes",
            "passingScore",
          ],
          properties: {
            title: {
              type: "string",
              example: "Backend TypeScript Assessment",
            },
            slug: {
              type: "string",
              example: "backend-typescript-assessment",
            },
            description: {
              type: "string",
              example:
                "Practical backend engineering assessment.",
            },
            difficulty: {
              type: "string",
              enum: ["JUNIOR", "MID", "SENIOR"],
              example: "MID",
            },
            durationMinutes: {
              type: "integer",
              example: 60,
            },
            passingScore: {
              type: "number",
              example: 70,
            },
            feeCents: {
              type: "integer",
              example: 1000,
            },
            currency: {
              type: "string",
              example: "usd",
            },
          },
        },

        QuestionInput: {
          type: "object",
          required: ["prompt", "type", "points", "order"],
          properties: {
            prompt: {
              type: "string",
              example:
                "Which HTTP status code is used after creating a resource?",
            },
            type: {
              type: "string",
              enum: ["MCQ", "TEXT", "CODE"],
              example: "MCQ",
            },
            options: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["200", "201", "204", "404"],
            },
            correctAnswer: {
              example: "201",
            },
            points: {
              type: "integer",
              example: 40,
            },
            order: {
              type: "integer",
              example: 1,
            },
          },
        },

        AnswerInput: {
          type: "object",
          required: ["response"],
          properties: {
            response: {
              example: "201",
            },
          },
        },
      },
    },
  },

  apis: ["./src/modules/**/*.route.ts"],
});

export default swaggerSpec;