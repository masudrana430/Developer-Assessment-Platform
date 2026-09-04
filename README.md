# Developer Assessment Platform Backend

A production-oriented REST API for running paid developer assessments. The system has exactly **3 primary roles**:

- **CANDIDATE** — browse assessments, enroll, pay, attempt, submit, view results.
- **REVIEWER** — author assessments/questions, publish assessments, claim submissions, grade subjective answers.
- **ADMIN** — manage users/roles/status, inspect system statistics, audit critical actions.

The codebase follows:

`Route -> Validation / Auth -> Controller -> Service -> Prisma -> PostgreSQL`

## Requirement Coverage

- Node.js + TypeScript + Express 5
- PostgreSQL + Prisma
- Zod validation
- JWT access + refresh tokens
- Google Identity Services ID-token login
- Strict role-based authorization
- Redis caching with graceful fallback
- Nodemailer integration
- Multer + Cloudinary profile image upload
- Stripe PaymentIntent integration + signed webhook verification
- Helmet, CORS, API/auth rate limits
- Soft deletes
- Audit logs
- Search, filtering, sorting, pagination
- PostgreSQL indexes
- Serializable transactions and atomic `updateMany` guards for race-sensitive operations
- Standard success/error response shape
- Versioned `/api/v1` routes
- Postman collection with a complete test workflow
- Render deployment template
- Seeded demo Admin, Reviewer, and Candidate

## API Count

The included Postman collection documents **40+ requests** covering authentication, profiles, assessments, questions, attempts, payments, reviews, and administration.

## Quick Start

### 1. Requirements

- Node.js 20+
- PostgreSQL
- Redis is recommended but optional
- Stripe test-mode account for payment testing
- Google OAuth Client ID only if you want to test Google login
- Cloudinary credentials only if you want to test avatar upload

### 2. Install

```bash
npm install
```

### 3. Environment

Copy:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set at minimum:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/developer_assessment?schema=public"
JWT_ACCESS_SECRET="replace-with-a-long-random-access-secret"
JWT_REFRESH_SECRET="replace-with-a-long-random-refresh-secret"
STRIPE_SECRET_KEY="sk_test_..."
```

For Stripe webhook testing also set:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Database

The project already contains an initial Prisma migration.

```bash
npx prisma generate
npx prisma migrate deploy
```

For local development you may instead use:

```bash
npx prisma migrate dev
```

### 5. Seed Demo Accounts

The server automatically upserts the three demo accounts on startup. You can also seed manually:

```bash
npm run seed
```

Default development credentials:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@devassess.com` | `Admin123!` |
| Reviewer | `reviewer@devassess.com` | `Reviewer123!` |
| Candidate | `candidate@devassess.com` | `Candidate123!` |

Change these through environment variables before deploying publicly.

### 6. Start

```bash
npm run dev
```

API:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/health
```

## API Documentation

Interactive Swagger UI is available at:

- Local: `http://localhost:5000/api-docs`
- Production: `https://developer-assessment-platform.onrender.com/api-docs`

The raw OpenAPI JSON document is available at:

`https://developer-assessment-platform.onrender.com/api-docs.json`

Swagger UI supports bearer-token authorization and keeps the entered token while the page is open.

## Postman Testing

Import:

```text
postman/Developer-Assessment-Platform.postman_collection.json
```

The collection already contains base URL, demo credentials, bearer-token variables, and test scripts that capture generated IDs/tokens.

Recommended run order:

1. **Login Reviewer**
2. **Login Candidate**
3. **Login Admin**
4. Reviewer -> **Create Assessment**
5. Reviewer -> **Add MCQ Question**
6. Reviewer -> **Add Text Question**
7. Reviewer -> **Publish Assessment**
8. Candidate -> **Enroll in Assessment**
9. Candidate -> **Initiate + Confirm Test Payment**
10. Candidate -> **Start Attempt**
11. Candidate -> **Save MCQ Answer**
12. Candidate -> **Save Text Answer**
13. Candidate -> **Submit Attempt**
14. Reviewer -> **Review Queue**
15. Reviewer -> **Claim Attempt**
16. Reviewer -> **Get Review Attempt**
17. Reviewer -> **Evaluate Attempt**
18. Candidate -> **Get Attempt**
19. Admin -> **Dashboard Stats**
20. Admin -> **Audit Logs**

Do not run the soft-delete demo requests until the normal workflow is complete.

## Stripe Test Flow

This backend uses Stripe PaymentIntents. It does not fake payment success.

A paid assessment creates an attempt in `PENDING_PAYMENT`.

Use the Postman request:

```text
POST /api/v1/payments/attempts/:attemptId/initiate
```

with:

```json
{
  "paymentMethodId": "pm_card_visa"
}
```

and a real Stripe **test secret key** in `.env`.

When Stripe returns `succeeded`, the backend atomically changes the attempt to `READY`.

You can also initiate without `paymentMethodId`, receive a `clientSecret`, and later call:

```text
POST /api/v1/payments/:paymentId/confirm
```

### Signed Stripe Webhook

Stripe requires the **raw request body** for signature verification. The webhook route is intentionally registered before `express.json()`.

Run Stripe CLI:

```bash
stripe login
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

Copy the generated `whsec_...` into:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Handled events:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_intent.processing`

Stripe's official guidance requires verifying the `Stripe-Signature` header against the untouched raw request body; this project follows that pattern.

## Google Login

Endpoint:

```text
POST /api/v1/auth/google
```

Body:

```json
{
  "credential": "GOOGLE_ID_TOKEN"
}
```

The backend verifies the ID token against `GOOGLE_CLIENT_ID`. New Google users are created as `CANDIDATE`; existing users keep their current role.

## Redis

Set:

```env
REDIS_URL="redis://localhost:6379"
```

Published assessment list responses are cached briefly and invalidated after assessment/question mutations.

Redis is treated as an optimization. If it is down, the API continues using PostgreSQL.

## Cloudinary Upload

Endpoint:

```text
PATCH /api/v1/users/me/avatar
```

Use `multipart/form-data`:

```text
profileImage = <JPEG/PNG/WebP <= 2 MB>
```

Required:

```env
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

## Security Details

- Passwords are hashed with bcrypt.
- Access tokens are short-lived.
- Refresh tokens contain a server-checked `tokenVersion`.
- Logout, blocking, role changes, and soft deletion invalidate existing refresh-token families by incrementing `tokenVersion`.
- Private endpoints require Bearer tokens.
- Role checks execute against the current database role/status, not only stale JWT claims.
- Helmet adds security headers.
- CORS is environment-controlled.
- Authentication and API requests are rate-limited.
- Candidate responses never expose `correctAnswer`.
- Reviewer scoring is limited to the question's maximum point value.
- Stripe webhook signatures are verified.
- No route exists for manually forcing a successful payment.

## Concurrency / Race-Condition Protection

Two important areas are protected:

### Candidate Enrollment

Enrollment executes inside a PostgreSQL **Serializable** transaction. It checks for an active attempt and generates the next attempt number atomically.

### Reviewer Claim

Reviewers claim a submission with a conditional atomic update:

- attempt must still be `SUBMITTED`
- `reviewerId` must still be `null`

Only one concurrent reviewer can claim it.

### Evaluation

Evaluation runs inside a Serializable transaction and calculates the final percentage from stored answer scores and question point values.

## Response Format

Success:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Paginated success may also include:

```json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "path": "body.email",
      "message": "Invalid email address"
    }
  ]
}
```

## Main Routes

### Authentication

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/google
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout
```

### User

```text
GET   /api/v1/users/me
PATCH /api/v1/users/me
PATCH /api/v1/users/me/avatar
```

### Assessments / Questions

```text
GET    /api/v1/assessments
GET    /api/v1/assessments/:id
GET    /api/v1/assessments/manage/mine
GET    /api/v1/assessments/manage/:id
POST   /api/v1/assessments
PATCH  /api/v1/assessments/:id
PATCH  /api/v1/assessments/:id/publish
DELETE /api/v1/assessments/:id
POST   /api/v1/assessments/:id/questions
PATCH  /api/v1/assessments/:id/questions/:questionId
DELETE /api/v1/assessments/:id/questions/:questionId
```

Published list supports:

```text
?page=1&limit=10&difficulty=MID&search=typescript&sortBy=createdAt&sortOrder=desc
```

### Candidate Attempts

```text
POST /api/v1/attempts/enroll/:assessmentId
GET  /api/v1/attempts/my
GET  /api/v1/attempts/:attemptId
POST /api/v1/attempts/:attemptId/start
PUT  /api/v1/attempts/:attemptId/answers/:questionId
POST /api/v1/attempts/:attemptId/submit
```

### Payments

```text
POST /api/v1/payments/attempts/:attemptId/initiate
POST /api/v1/payments/:paymentId/confirm
GET  /api/v1/payments/attempts/:attemptId
GET  /api/v1/payments/:paymentId
POST /api/v1/payments/webhook
```

### Reviews

```text
GET  /api/v1/reviews/queue
GET  /api/v1/reviews/mine
GET  /api/v1/reviews/:attemptId
POST /api/v1/reviews/:attemptId/claim
POST /api/v1/reviews/:attemptId/evaluate
```

### Admin

```text
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:userId/status
PATCH  /api/v1/admin/users/:userId/role
DELETE /api/v1/admin/users/:userId
GET    /api/v1/admin/stats
GET    /api/v1/admin/audit-logs
```

## Soft Delete Policy

`User`, `Assessment`, and `Question` use `deletedAt` instead of physical deletion.

Critical relationships such as attempts, payments, reviews, and audit logs remain preserved for history.

## Audit Events

Examples:

- registration/login/logout
- profile changes
- assessment create/update/publish/delete
- question create/update/delete
- candidate enrollment/start/submit
- payment initiation/confirmation
- reviewer claim/evaluation
- admin status/role/delete actions

## Deployment on Render

A starter `render.yaml` is included.

Production steps:

1. Create PostgreSQL.
2. Create Redis if desired.
3. Create a Render Web Service from the repository.
4. Add environment variables.
5. Build command:

```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

6. Start command:

```bash
npm start
```

7. Set Stripe webhook URL to:

```text
https://YOUR-RENDER-DOMAIN/api/v1/payments/webhook
```

## Assignment Commit Requirement

The delivered project includes a Git history with 20+ meaningful commits. If you extract/copy files into a brand-new repository instead of pushing this repository itself, that history will be lost.

To preserve it, push the extracted project's existing `.git` history:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

## Verification Notes

The source tree was checked for:

- TypeScript syntax across all source/seed files
- broken relative imports
- route/module wiring
- raw Stripe webhook ordering
- authorization boundaries
- public draft/correct-answer leakage
- soft-delete behavior
- concurrency-sensitive state transitions

Before submission, run in your own environment:

```bash
npm install
npm run build
npm run lint
npx prisma migrate deploy
npm run dev
```

Then execute the Postman workflow against your PostgreSQL and Stripe test account.

## Submission Template

```text
Project Name    : Developer Assessment Platform
Backend Repo    : https://github.com/YOUR-USERNAME/developer-assessment-platform
Live API        : https://YOUR-RENDER-DOMAIN
API Docs        : Import/share the included Postman collection
Demo Video      : YOUR_VIDEO_LINK
Admin Email     : admin@devassess.com
Admin Password  : Admin123!
```

Change the demo password before exposing a public production service.
