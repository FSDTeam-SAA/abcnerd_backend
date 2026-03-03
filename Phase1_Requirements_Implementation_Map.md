# Phase 1 Requirements → Implementation Mapping

This document captures the current state of the codebase and ties each business requirement defined for Phase 1 to the corresponding source-code locations and behaviors. It is a living artifact and should be kept in sync as features evolve.

> **Last updated:** 2026‑03‑03

---

## 1. Authentication & User Management

### 1.1 User Registration

- **Controller:** `src/modules/usersAuth/user.controller.ts` → `registration()`
- **Service:** `src/modules/usersAuth/user.service.ts` → `registerUser()`
- **Validation:** `src/modules/usersAuth/user.validation.ts` → `registerUserSchema`
- **Route:** `POST /api/user/register-user`
- **Notes:** password hashing in `user.models.ts`; admin emails auto‑assign role via `config.adminEmails`.

### 1.2 Email Verification / OTP

- **Controller:** `verifyAccount()` in user controller
- **Service:** `userService.verifyAccount()`
- **Validation:** `verifyAccountSchema`
- **Route:** `POST /api/user/verify-account`
- **Status:** OTP mailing is currently commented out; flow exists but not enabled.

### 1.3 User Login

- **Local login:**
  - Controller: `login()`
  - Service: `userService.login(email, password, rememberMe)`
  - Validation: `loginSchema`
  - Route: `POST /api/user/login` (rate‑limited 5/min)
  - Response returns tokens and user details; cookies set (`accessToken`, `refreshToken`).
- **Google OAuth:**
  - Controller: `loginWithGoogle()`
  - Service: `userService.loginWithGoogle(token)` (uses `google-auth-library`).
  - Route: `POST /api/user/login-with-google`.
- **Kakao OAuth:** passport strategy in `src/Oauth/passport/kakao.ts` (currently commented).

### 1.4 Forgot / Reset Password

- **Endpoints:**
  - `POST /api/user/forget-password` → `forgetPassword()`
  - `POST /api/user/verify-otp` → `verifyOtpForgetPassword()`
  - `POST /api/user/reset-password/:token` → `resetPassword()`
- **Service:** generates OTP, emails via `nodeMailer`, validates tokens, updates password.
- **Templates:** `src/tempaletes/auth.templates.ts`.

### 1.5 Token Generation / Refresh

- **Controller:** `generateAccessToken()`
- **Service:** validates refresh token and issues new access cookie.
- **Route:** `POST /api/user/generate-access-token`.

### 1.6 User Logout

- **Controller:** `logout()`
- **Service:** clears refresh token from DB
- **Route:** `POST /api/user/logout` (clears cookies).

### 1.7 Profile Retrieval & Management

- **My profile:** `GET /api/user/get-my-profile` → `getmyprofile()`
- **Single user:** `GET /api/user/get-single-user/:userId` → `getSingleUser()`
- **All users (admin):** `GET /api/user/get-all-user` → `getalluser()`
- **Update profile:** `PATCH /api/user/update-user` → `updateUser()` (multer + Cloudinary)
- **Change password:** `PATCH /api/user/update-password` → `updatePassword()`
- **Admin status change:** `PATCH /api/user/update-status/:userId` → `updateStatus()`

## 2. Word Management

### 2.1 Create / Store Words

- Controller: `wordmanagement.controller.ts` → `createWordmanagement()`
- Service: `wordmanagement.service.ts` → `createWordmanagement(data)`
- Route: `POST /api/wordmanagement`
- Validation: `createWordmanagementSchema`
- Payload includes word, definitions, category, examples, tags, etc.

### 2.2 Search & Filter

- Controller: `getAllWordmanagements()`
- Route: `GET /api/wordmanagement` with query params `search`, `categoryType`, `isactive`, `sortBy`, `page`, `limit`
- Service builds filters and returns paginated results.

### 2.3 View Details

- Controller: `getWordmanagementById()`
- Route: `GET /api/wordmanagement/:wordId`
- Service restricts visibility of inactive words for non‑admins.

### 2.4 Update & Delete

- Update: `PATCH /api/wordmanagement/:wordId` → `updateWordmanagement()`
- Delete: `DELETE /api/wordmanagement/:wordId` → `deleteWordmanagement()` (hard/soft configurable)

## 3. Categories

- Controllers, services, models located under `src/modules/categoryword/*`
- Full CRUD via `/api/categoryword` endpoints.

## 4. Quizzes & Attempts

### 4.1 Generate Quiz

- Controller: `quiz.controller.ts` → `generateQuiz()`
- Route: `POST /api/Quiz/generate` (auth)
- Service selects random words from category.

### 4.2 Submit Answers

- Controller: `quizattempt.controller.ts` → `submitQuizAttempt()`
- Route: `POST /api/quiz-attempt/submit`
- Service evaluates responses, calculates score, saves attempt.

### 4.3 History & Review

- History: `GET /api/Quiz/history` → `getUserQuizHistory()`
- Review endpoint implemented in quiz‑attempt controllers.

## 5. Subscriptions & Payments

### 5.1 Subscription Plans

- CRUD controllers/services in `subscriptionplan` module.
- Stripe product/price IDs stored on plan documents.

### 5.2 Subscribe / Payment

- Controller: `subscription.controller.ts` → `subscribe()`
- Route: `POST /api/payment/subscribe`
- Stripe integration via `src/lib/stripe.ts` and webhook handlers in service.

### 5.3 Manage & Cancel

- Cancel endpoint `POST /api/payment/cancel` → `cancelSubscription()`
- Webhooks handle renewals, invoice creation.

### 5.4 Invoices

- Controllers/services under `invoice` module
- Webhook captures payment events to create invoice records.

## 6. Learning & Progress

### 6.1 Track Learning

- `learning` module handles creation of learning records.
- Fields: `status`, `reviewCount`, `lastReviewedAt`.

### 6.2 View Progress

- `progress` module provides summaries by category or overall.
- Routes: `GET /api/progress` and `/api/progress/:categoryId`.

## 7. Notifications

- `notification` module supports in‑app notifications with read/unread and action URLs.

## 8. Notebook

- CRUD operations for user notes in `notebook` module.

## 9. Chatbot / AI Assistance

- `chatbot` module integrates with Gemini via `@google/genai`.

## 10. Cross‑cutting Concerns

- Authentication, permission, validation, rate‑limiting, multer, global error handler, not‑found middleware.
- Helpers and utilities support async handling, pagination, OTP generation, Cloudinary uploads, mailing, custom errors, etc.

## 11. Configuration & Infrastructure

- `src/config/index.ts` manages environment variables.
- Database connection via Mongoose in `src/database/db.ts`.
- Cron job for balance resets in `src/database/balance-reset.cron.ts`.

## 12. API Route Summary

A concise table of modules, base paths and primary endpoints mirrors the list in `REQUIREMENTS.md`.

---

This markdown file reflects the implemented features in Phase 1 of the project. Refer to `REQUIREMENTS.md` for detailed requirement descriptions or to source files for implementation specifics.
