# Requirements → Implementation Mapping

This document maps business requirements to the corresponding source code implementations.

---

## Authentication & User Management

### REQ: User Registration
**Description:** Users can create an account with email and password.

**Implementation:**
- **Controller:** [src/modules/usersAuth/user.controller.ts](src/modules/usersAuth/user.controller.ts) — `registration()`
- **Service:** [src/modules/usersAuth/user.service.ts](src/modules/usersAuth/user.service.ts) — `registerUser()`
- **Validation:** [src/modules/usersAuth/user.validation.ts](src/modules/usersAuth/user.validation.ts) — `registerUserSchema`
- **Route:** `POST /api/user/register-user`
- **Payload:**
  ```typescript
  { email: string, name: string, password: string, role?: "user" | "admin" }
  ```
- **Response:** User with email, name (password excluded)

**Related Code:**
- Password hashing: `bcryptjs` in `user.models.ts` schema
- Admin email detection: `config.adminEmails` auto-assigns admin role

---

### REQ: Email Verification / OTP
**Description:** Email verification via OTP (optional/commented-out flow).

**Implementation:**
- **Controller:** `verifyAccount()`
- **Service:** `userService.verifyAccount()`
- **Validation:** `verifyAccountSchema`
- **Route:** `POST /api/user/verify-account`
- **Note:** OTP sending is currently disabled in the code (see commented-out mailer call).

---

### REQ: User Login
**Description:** Users log in with email/password or social provider.

**Implementation:**

#### Local Login
- **Controller:** `login()`
- **Service:** `userService.login(email, password, rememberMe)`
- **Validation:** `loginSchema`
- **Route:** `POST /api/user/login` (rate-limited to 5 attempts / min)
- **Response:**
  ```typescript
  { email, name, role, accessToken, refreshToken }
  ```
- **Cookies:** `accessToken` (15 min), `refreshToken` (15 days) set with `httpOnly`, `sameSite: "none"`, `secure: true`

#### Google OAuth Login
- **Controller:** `loginWithGoogle()`
- **Service:** `userService.loginWithGoogle(token)`
- **Route:** `POST /api/user/login-with-google`
- **Implementation:** OAuth2Client from `google-auth-library`; token verified, user found/created

#### Kakao OAuth Login
- **Controller:** `loginWithKakao()`
- **Service:** `userService.loginWithKakao(code)`
- **Route:** `POST /api/user/login-with-kakao`
- **Implementation:** Passport + Kakao strategy (configured but commented in `src/Oauth/passport/kakao.ts`)

#### Apple OAuth Login
- **Controller:** `loginWithApple()`
- **Service:** `userService.loginWithApple(identityToken, userName?)`
- **Route:** `POST /api/user/login-with-apple`
- **Implementation:** `apple-signin-auth` library; verify identity token, get user email

---

### REQ: Forgot Password / Reset Password
**Description:** User can reset forgotten password via emailed OTP/token.

**Implementation:**
- **Forget Password Endpoint:**
  - **Controller:** `forgetPassword()`
  - **Route:** `POST /api/user/forget-password`
  - **Service:** generates OTP, emails user
  
- **Verify OTP:**
  - **Controller:** `verifyOtpForgetPassword()`
  - **Route:** `POST /api/user/verify-otp`
  - **Service:** validates OTP, returns reset token
  
- **Reset Password:**
  - **Controller:** `resetPassword(token, password)`
  - **Route:** `POST /api/user/reset-password/:token`
  - **Service:** validates token, updates password

**Email Template:** [src/tempaletes/auth.templates.ts](src/tempaletes/auth.templates.ts)  
**Mailer:** [src/helpers/nodeMailer.ts](src/helpers/nodeMailer.ts) (SMTP via nodemailer)

---

### REQ: Token Generation / Refresh
**Description:** Generate new access token from refresh token.

**Implementation:**
- **Controller:** `generateAccessToken()`
- **Route:** `POST /api/user/generate-access-token`
- **Service:** validates refresh token, issues new access token
- **Cookies:** new `accessToken` cookie set

---

### REQ: User Logout
**Description:** Clear refresh token and logout user.

**Implementation:**
- **Controller:** `logout()`
- **Route:** `POST /api/user/logout`
- **Service:** clears refresh token from DB
- **Cookies:** clears `accessToken`, `refreshToken` cookies

---

### REQ: Get User Profile / My Profile
**Description:** Retrieve authenticated user's profile or any user by ID.

**Implementation:**
- **My Profile:**
  - **Controller:** `getmyprofile()`
  - **Route:** `GET /api/user/get-my-profile` (requires auth)
  - **Service:** `getmyprofile(req)` — fetches from req.user.email
  
- **Single User by ID:**
  - **Controller:** `getSingleUser(userId)`
  - **Route:** `GET /api/user/get-single-user/:userId` (requires auth)
  - **Service:** `getUser(userId)`
  
- **All Users (Admin):**
  - **Controller:** `getalluser()`
  - **Route:** `GET /api/user/get-all-user` (requires auth)
  - **Service:** `getAllUsers(req)` — filters by role, status, provider, search; paginated

---

### REQ: Update User Profile
**Description:** Update name, bio, profile image.

**Implementation:**
- **Controller:** `updateUser()`
- **Route:** `PATCH /api/user/update-user` (requires auth)
- **Middleware:** multer for image upload (`upload.single("image")`)
- **Service:** `updateUser(req)` — uploads to Cloudinary, updates DB
- **Payload:** `{ name?, selfIntroduction?, profileImage? }`

---

### REQ: Update User Password
**Description:** Change password (requires current password).

**Implementation:**
- **Controller:** `updatePassword()`
- **Route:** `PATCH /api/user/update-password` (auth + rate-limited)
- **Service:** `updatePassword(req)` — verifies old password, updates to new
- **Validation:** `updatePasswordSchema`

---

### REQ: Update User Status (Admin)
**Description:** Admin can block/ban/activate users.

**Implementation:**
- **Controller:** `updateStatus()`
- **Route:** `PATCH /api/user/update-status/:userId` (admin only)
- **Service:** `updateStatus(req)` — updates status field
- **Validation:** `updateStatusSchema` — allows `active`, `inactive`, `blocked`, `banned`

---

## Word Management

### REQ: Create/Store Words
**Description:** Store dictionary entries with definitions, examples, pronunciation.

**Implementation:**
- **Controller:** [src/modules/wordmanagement/wordmanagement.controller.ts](src/modules/wordmanagement/wordmanagement.controller.ts) — `createWordmanagement()`
- **Service:** [src/modules/wordmanagement/wordmanagement.service.ts](src/modules/wordmanagement/wordmanagement.service.ts) — `createWordmanagement(data)`
- **Route:** `POST /api/wordmanagement`
- **Validation:** [src/modules/wordmanagement/wordmanagement.validation.ts](src/modules/wordmanagement/wordmanagement.validation.ts) — `createWordmanagementSchema`
- **Payload:**
  ```typescript
  {
    word: string,
    description: string,
    pronunciation?: string,
    examples?: string[],
    synonyms?: string[],
    categoryWordId: ObjectId,
    partOfSpeech?: enum,
    tags?: string[],
    frequency?: number
  }
  ```

---

### REQ: Search & Filter Words
**Description:** Search words by keyword, filter by category, part-of-speech, status.

**Implementation:**
- **Controller:** `getAllWordmanagements()`
- **Route:** `GET /api/wordmanagement?search=...&categoryType=...&isactive=...&sortBy=asc|desc`
- **Service:** `getAllWordmanagements(req)` — builds filters, returns paginated results
- **Query Parameters:**
  - `search` — regex on `word` field (case-insensitive)
  - `categoryType` — filter by category name
  - `isactive` — filter by status (`active`, `inactive`, `blocked`, `all`)
  - `sortBy` — sort by `createdAt` (`asc` or `desc`)
  - `page`, `limit` — pagination

---

### REQ: View Word Details
**Description:** Get single word with all details.

**Implementation:**
- **Controller:** `getWordmanagementById()`
- **Route:** `GET /api/wordmanagement/:wordId`
- **Service:** `getWordmanagementById(role, wordId)` — non-admin users see only `active` words

---

### REQ: Update Word
**Description:** Edit word details, pronunciation, examples, etc.

**Implementation:**
- **Controller:** `updateWordmanagement()`
- **Route:** `PATCH /api/wordmanagement/:wordId`
- **Service:** `updateWordmanagement(wordId, data)`
- **Validation:** `updateWordmanagementSchema` — all fields optional, partial updates supported

---

### REQ: Delete Word
**Description:** Remove word from system.

**Implementation:**
- **Controller:** `deleteWordmanagement()`
- **Route:** `DELETE /api/wordmanagement/:wordId`
- **Service:** `deleteWordmanagement(wordId)` — hard delete or soft delete (configurable)

---

## Categories

### REQ: Create/Manage Word Categories
**Description:** Organize words into categories (topics, difficulty levels).

**Implementation:**
- **Controller:** [src/modules/categoryword/categoryword.controller.ts](src/modules/categoryword/categoryword.controller.ts)
- **Routes:** [src/modules/categoryword/categoryword.routes.ts](src/modules/categoryword/categoryword.routes.ts)
- **Service:** [src/modules/categoryword/categoryword.service.ts](src/modules/categoryword/categoryword.service.ts)
- **CRUD Operations:** POST (create), GET (list/detail), PATCH (update), DELETE (remove)

---

## Quizzes & Attempts

### REQ: Generate / Take Quiz
**Description:** User generates quiz from word category or takes existing quiz.

**Implementation:**
- **Controller:** [src/modules/quiz/quiz.controller.ts](src/modules/quiz/quiz.controller.ts) — `generateQuiz()`
- **Route:** `POST /api/Quiz/generate` (auth required)
- **Service:** [src/modules/quiz/quiz.service.ts](src/modules/quiz/quiz.service.ts) — picks random words from category, creates quiz

---

### REQ: Submit Quiz Answers
**Description:** User submits answers, system calculates score.

**Implementation:**
- **Controller:** [src/modules/quizattempt/quizattempt.controller.ts](src/modules/quizattempt/quizattempt.controller.ts) — `submitQuizAttempt()`
- **Route:** `POST /api/quiz-attempt/submit`
- **Service:** [src/modules/quizattempt/quizattempt.service.ts](src/modules/quizattempt/quizattempt.service.ts) — validates answers, calculates score, stores attempt
- **Payload:**
  ```typescript
  { quizId: ObjectId, responses: [ { questionId, selectedAnswer }, … ] }
  ```

---

### REQ: View Quiz History
**Description:** User sees past quizzes and scores.

**Implementation:**
- **Controller:** `getUserQuizHistory()`
- **Route:** `GET /api/Quiz/history` (auth required)
- **Service:** `getUserQuizHistory(userId)` — returns list of Quiz and QuizAttempt records, sorted by date

---

## Subscriptions & Payments

### REQ: Define Subscription Plans
**Description:** Admin defines multiple tiers (Basic, Pro, Premium) with pricing/features.

**Implementation:**
- **Controller:** [src/modules/subscriptionplan/subscriptionplan.controller.ts](src/modules/subscriptionplan/subscriptionplan.controller.ts)
- **Routes:** [src/modules/subscriptionplan/subscriptionplan.routes.ts](src/modules/subscriptionplan/subscriptionplan.routes.ts)
- **Service:** [src/modules/subscriptionplan/subscriptionplan.service.ts](src/modules/subscriptionplan/subscriptionplan.service.ts)
- **Models:** [src/modules/subscriptionplan/subscriptionplan.models.ts](src/modules/subscriptionplan/subscriptionplan.models.ts)
- **Stripe Integration:** `stripePriceId`, `stripeProductId` linked

---

### REQ: Subscribe to Plan
**Description:** User purchases subscription, payment processed via Stripe.

**Implementation:**
- **Controller:** [src/modules/subscription/subscription.controller.ts](src/modules/subscription/subscription.controller.ts)
- **Route:** `POST /api/payment/subscribe`
- **Service:** [src/modules/subscription/subscription.service.ts](src/modules/subscription/subscription.service.ts)
- **Stripe Integration:** [src/lib/stripe.ts](src/lib/stripe.ts)
  - Creates Stripe checkout session
  - Webhook handlers for `checkout.session.completed`, `invoice.payment_succeeded`, etc.
- **Payload:** `{ planId: ObjectId }`

---

### REQ: Manage Subscription (Cancel, Renew)
**Description:** Users can cancel subscriptions or Stripe auto-renews them.

**Implementation:**
- **Cancel Endpoint:** `POST /api/payment/cancel`
- **Service:** `cancelSubscription(subscriptionId)` — marks `status: "canceled"`, sets `canceledAt`
- **Auto-renewal:** Handled by Stripe webhooks in `subscription.service.ts`

---

### REQ: Track Invoices
**Description:** Store and retrieve billing invoices.

**Implementation:**
- **Controller:** [src/modules/invoice/invoice.controller.ts](src/modules/invoice/invoice.controller.ts)
- **Service:** [src/modules/invoice/invoice.service.ts](src/modules/invoice/invoice.service.ts)
- **Routes:** [src/modules/invoice/invoice.routes.ts](src/modules/invoice/invoice.routes.ts)
- **Stripe Webhook:** Creates Invoice record on payment success

---

## Learning & Progress

### REQ: Track Learning Progress
**Description:** Record words learned, review counts, mastery levels.

**Implementation:**
- **Controller:** [src/modules/learning/learning.controller.ts](src/modules/learning/learning.controller.ts)
- **Service:** [src/modules/learning/learning.service.ts](src/modules/learning/learning.service.ts)
- **Routes:** [src/modules/learning/learning.routes.ts](src/modules/learning/learning.routes.ts)
- **Model Fields:** `status` (learning, reviewing, mastered), `reviewCount`, `lastReviewedAt`

---

### REQ: View Progress Summary
**Description:** User sees statistics: words learned, mastery %, streaks.

**Implementation:**
- **Controller:** [src/modules/progress/progress.controller.ts](src/modules/progress/progress.controller.ts)
- **Service:** [src/modules/progress/progress.service.ts](src/modules/progress/progress.service.ts)
- **Route:** `GET /api/progress/:categoryId` or `GET /api/progress`
- **Model Fields:** `totalLearned`, `totalMastered`, `averageScore`, `lastActivityAt`

---

## Notifications

### REQ: Send In-App Notifications
**Description:** Notify users of quiz completion, streak achievements, subscription renewal.

**Implementation:**
- **Controller:** [src/modules/notification/notification.controller.ts](src/modules/notification/notification.controller.ts)
- **Service:** [src/modules/notification/notification.service.ts](src/modules/notification/notification.service.ts)
- **Routes:** [src/modules/notification/notification.routes.ts](src/modules/notification/notification.routes.ts)
- **Model Fields:** `title`, `message`, `type` (info, warning, error, success), `isRead`, `actionUrl`

---

## Notebook (User Notes)

### REQ: Create & Manage Notes
**Description:** Users can create notes, highlight words, maintain study notes.

**Implementation:**
- **Controller:** [src/modules/notebook/notebook.controller.ts](src/modules/notebook/notebook.controller.ts)
- **Service:** [src/modules/notebook/notebook.service.ts](src/modules/notebook/notebook.service.ts)
- **Routes:** [src/modules/notebook/notebook.routes.ts](src/modules/notebook/notebook.routes.ts)
- **Model Fields:** `content`, `tags`, `isStarred`, `word` (optional reference)

---

## Chatbot / AI Assistance

### REQ: AI Chat with User
**Description:** Users chat with AI for word explanations, examples, study help.

**Implementation:**
- **Controller:** [src/modules/chatbot/chatbot.controller.ts](src/modules/chatbot/chatbot.controller.ts)
- **Service:** [src/modules/chatbot/chatbot.service.ts](src/modules/chatbot/chatbot.service.ts)
- **Routes:** [src/modules/chatbot/chatbot.routes.ts](src/modules/chatbot/chatbot.routes.ts)
- **AI Library:** `@google/genai` for Gemini API integration
- **Model Fields:** `messages` array with `role` (user/assistant), `content`, `timestamp`

---

## Cross-cutting Concerns

### Middleware

#### Authentication Middleware
- **File:** [src/middleware/auth.middleware.ts](src/middleware/auth.middleware.ts)
- **Function:** `authGuard()`
- **Purpose:** Verify JWT access token, attach user to `req.user`
- **Protected Routes:** Most endpoints require this middleware

#### Permission Middleware
- **File:** [src/middleware/permission.middleware.ts](src/middleware/permission.middleware.ts)
- **Function:** `permission(roles: string[])`
- **Purpose:** Check user role (admin, user) for endpoint access

#### Validation Middleware
- **File:** [src/middleware/validateRequest.middleware.ts](src/middleware/validateRequest.middleware.ts)
- **Function:** `validateRequest(schema)`
- **Purpose:** Validate request body against Zod schema

#### Rate Limiter Middleware
- **File:** [src/middleware/rateLimiter.middleware.ts](src/middleware/rateLimiter.middleware.ts)
- **Function:** `rateLimiter(windowMs, maxRequests)`
- **Purpose:** Prevent brute-force attacks on sensitive endpoints (login, password reset)

#### Multer Middleware (File Upload)
- **File:** [src/middleware/multer.midleware.ts](src/middleware/multer.midleware.ts)
- **Purpose:** Handle image upload to `/uploads` folder, used with Cloudinary

#### Global Error Handler
- **File:** [src/helpers/globalErrorHandler.ts](src/helpers/globalErrorHandler.ts)
- **Purpose:** Catch errors, format response, send to client

#### Not Found Handler
- **File:** [src/middleware/notFound.ts](src/middleware/notFound.ts)
- **Purpose:** Return 404 for undefined routes

### Utilities & Helpers

| File | Purpose |
|------|---------|
| [src/utils/asyncHandler.ts](src/utils/asyncHandler.ts) | Wrapper for async controller functions; catches errors |
| [src/utils/apiResponse.ts](src/utils/apiResponse.ts) | Standardize JSON response format (`message`, `statusCode`, `data`, `meta`) |
| [src/utils/pagination.ts](src/utils/pagination.ts) | Calculate page/limit/skip for queries |
| [src/utils/otpGenerator.ts](src/utils/otpGenerator.ts) | Generate random OTP codes |
| [src/helpers/CustomError.ts](src/helpers/CustomError.ts) | Custom error class for HTTP responses |
| [src/helpers/cloudinary.ts](src/helpers/cloudinary.ts) | Upload/delete images to Cloudinary |
| [src/helpers/nodeMailer.ts](src/helpers/nodeMailer.ts) | Send emails via SMTP |
| [src/helpers/emailValidator.ts](src/helpers/emailValidator.ts) | Validate email format & disposable domains |
| [src/helpers/dayKey.ts](src/helpers/dayKey.ts) | Generate day-based keys for rate limiting |

### Configuration

- **File:** [src/config/index.ts](src/config/index.ts)
- **Purpose:** Load environment variables, export config object
- **Keys:** `port`, `env`, `mongo.uri`, `jwt.*`, `cloudinary.*`, `stripe.*`, `smtp.*`, `adminEmails`, etc.

### Database

- **File:** [src/database/db.ts](src/database/db.ts)
- **Purpose:** Connect to MongoDB via Mongoose
- **Function:** `connectDatabase()`

### Cron Jobs

- **File:** [src/database/balance-reset.cron.ts](src/database/balance-reset.cron.ts)
- **Purpose:** Scheduled job to reset user resource balances (runs on schedule via `node-cron`)

---

## API Route Summary

| Module | Base Path | Main Endpoints |
|--------|-----------|----------------|
| User | `/api/user` | POST `/register-user`, POST `/login`, GET `/get-my-profile`, PATCH `/update-user`, PATCH `/update-password`, POST `/logout`, etc. |
| CategoryWord | `/api/categoryword` | POST, GET (list/detail), PATCH, DELETE |
| Wordmanagement | `/api/wordmanagement` | POST, GET (list/detail/search/filter), PATCH, DELETE |
| Quiz | `/api/Quiz` | POST `/generate`, GET `/history`, GET `/:quizId` |
| QuizAttempt | `/api/quiz-attempt` | POST `/submit`, GET `/review/:attemptId` |
| SubscriptionPlan | `/api/subscriptionplan` | GET (list/detail) |
| Subscription (Payment) | `/api/payment` | POST `/subscribe`, POST `/cancel`, GET `/my-subscription` |
| Invoice | `/api/invoice` | GET (list/detail) |
| Notification | `/api/notification` | GET (list), PATCH `/:id/read`, DELETE `/:id` |
| Learning | `/api/learning` | POST (create), GET (list/detail), PATCH |
| Progress | `/api/progress` | GET (summary/by-category) |
| Notebook | `/api/notebook` | POST (create), GET (list), PATCH, DELETE |
| Chatbot | `/api/chatbot` | POST (send message), GET (history) |
| Question | `/api/question` | GET (list/detail) |
| Review | `/api/review` | POST (create), GET (list) |

---

## Testing Recommendations

### Unit Tests
- [ ] Auth service (login, token generation, password reset)
- [ ] Pagination helper
- [ ] Query filter validation (wordmanagement, users)

### Integration Tests
- [ ] Register → Login → Get Profile flow
- [ ] Create word → Search → View flow
- [ ] Subscribe → Get invoice flow
- [ ] Generate quiz → Submit attempt → Check score

### E2E Tests
- [ ] Full user onboarding
- [ ] Word lookup + quiz + subscription workflow
- [ ] Admin panel (user management, word CRUD)

---

## Deployment Notes

- **Build:** `npm run build` generates `dist/` folder
- **Start:** `npm run start` runs compiled code from `dist/`
- **Env vars:** Load from `.env` file (see `.env.example`)
- **Database:** Requires MongoDB (Atlas or local)
- **File uploads:** Requires Cloudinary account
- **Payments:** Requires Stripe account + webhook URL setup
- **Emails:** Requires SMTP credentials (Gmail, SendGrid, etc.)

---

**Last Updated:** 2026-03-03  
**Status:** Complete implementation with all core features
