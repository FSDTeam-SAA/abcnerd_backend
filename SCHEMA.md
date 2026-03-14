# Database Schema Documentation

## Overview
This document outlines the MongoDB schema for the ABCNerd backend application. All models are built with Mongoose and include standard auditing fields (`createdAt`, `updatedAt`, `isDeleted`, `deletedAt`).

---

## Collections

### 1. **Users**
Stores user account information, authentication credentials, and subscription state.

**Model Location:** `src/modules/usersAuth/user.models.ts`

**Key Fields:**
- `_id` (ObjectId) — primary key
- `name` (String) — user's display name
- `email` (String, unique) — email address
- `password` (String) — bcrypt-hashed password (only for `provider: "local"`)
- `role` (String, enum: `admin`, `user`) — user role
- `profession` (String, optional)
- `profileImage` (Object)
  - `public_id` (String) — Cloudinary public ID
  - `secure_url` (String) — Cloudinary image URL
- `status` (String, enum: `active`, `inactive`, `blocked`, `banned`)
- `selfIntroduction` (String, optional)
- `provider` (String, enum: `local`, `google`, `kakao`, `apple`) — authentication method
- `providerId` (String) — provider's user ID (for OAuth)
- `isVerified` (Boolean) — account verification status
- `verificationOtp` (String | null) — OTP for registration verification
- `verificationOtpExpire` (Date | null) — OTP expiration time
- `balance` (Object) — resource balance
  - `wordSwipe` (Number) — remaining word swipes
  - `aiChat` (Number) — remaining AI chat queries
  - `validityDate` (Date) — balance reset date
- `subscription` (Object) — active subscription info
  - `subscriptionId` (ObjectId, ref: Subscription)
  - `plan` (String, enum: `basic`, `pro`, `premium`)
  - `status` (String, enum: `pending`, `active`, `expired`, `past_due`, `failed`)
  - `startDate` (Date)
  - `endDate` (Date)
  - `lastResetDate` (Date, optional) — last balance reset
- `refreshToken` (String | null) — JWT refresh token
- `resetPassword` (Object)
  - `otp` (String | null) — password reset OTP
  - `otpExpire` (Date | null)
  - `token` (String | null) — password reset token
  - `tokenExpire` (Date | null)
- `rememberMe` (Boolean) — "remember me" login flag
- `lastLogin` (Date) — last login timestamp
- `createdAt`, `updatedAt`, `isDeleted`, `deletedAt` — audit fields

**Methods:**
- `comparePassword(password)` — verify password against hash
- `createAccessToken()` — generate JWT access token
- `createRefreshToken()` — generate JWT refresh token
- `generateResetPasswordToken()` — generate password reset token
- `updatePassword(currentPassword, newPassword)` — change password

**Indexes:**
- `email` (unique)
- `provider`, `providerId`

---

### 2. **CategoryWord**
Groups words by category/topic.

**Model Location:** `src/modules/categoryword/categoryword.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `name` (String, unique) — category name (e.g., "Animals", "Technology")
- `description` (String) — category description
- `status` (String, enum: `active`, `inactive`)
- `image` (Object, optional)
  - `public_id` (String) — Cloudinary ID
  - `secure_url` (String)
- `slug` (String) — URL-friendly identifier
- `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`

**Relationships:**
- Referenced by Wordmanagement (one-to-many)

---

### 3. **Wordmanagement**
Dictionary entries with detailed linguistic information.

**Model Location:** `src/modules/wordmanagement/wordmanagement.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `word` (String, unique) — the word itself
- `description` (String) — definition/meaning
- `pronunciation` (String, optional) — phonetic pronunciation (e.g., "/əˈkɑːmplɪʃ/")
- `examples` (Array of String) — usage examples (max 20)
- `synonyms` (Array of String, optional) — similar words
- `categoryWordId` (ObjectId, ref: CategoryWord) — parent category
- `categoryType` (String) — denormalized category name for fast access
- `wordType` (String, enum: `Frequent`, `Medium`, `Difficulty`, `Entire`)
- `partOfSpeech` (String, enum: `Noun`, `Verb`, `Adjective`, …) — grammar classification
- `tags` (Array of String) — searchable tags (auto-lowercased, unique)
- `frequency` (Number, optional) — usage frequency score
- `status` (String, enum: `active`, `inactive`, `blocked`)
- `slug` (String) — URL-friendly identifier
- `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`

**Relationships:**
- Many-to-one: CategoryWord
- Referenced by Quiz (array of questions), Learning, Progress

**Query Features:**
- Search by word (case-insensitive regex)
- Filter by status, categoryType, partOfSpeech
- Pagination with sort by createdAt (asc/desc)

---

### 4. **Quiz**
Quiz metadata and question associations.

**Model Location:** `src/modules/quiz/quiz.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `user` (ObjectId, ref: User) — quiz creator/taker
- `category` (ObjectId, ref: CategoryWord) — category being quizzed
- `questions` (Array of ObjectId, ref: Question) — question references
- `status` (String, enum: `ongoing`, `completed`, `abandoned`)
- `totalQuestions` (Number) — count of questions
- `attempt` (ObjectId, ref: QuizAttempt, optional) — linked attempt after submission
- `createdAt`, `updatedAt`

**Relationships:**
- Many-to-one: User (user can have multiple quizzes)
- Many-to-one: CategoryWord
- Many-to-many: Question (array)
- One-to-one: QuizAttempt (optional, after completion)

---

### 5. **QuizAttempt**
Stores user responses and scoring for a completed quiz.

**Model Location:** `src/modules/quizattempt/quizattempt.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `user` (ObjectId, ref: User)
- `quiz` (ObjectId, ref: Quiz)
- `responses` (Array of Object)
  - `questionId` (ObjectId)
  - `selectedAnswer` (String) — user's chosen answer
  - `isCorrect` (Boolean)
- `score` (Number) — points earned
- `totalScore` (Number) — max possible score
- `percentage` (Number) — % correct
- `createdAt`, `updatedAt`

**Relationships:**
- Many-to-one: User
- One-to-one: Quiz

---

### 6. **Question**
Individual quiz question items (associated with words).

**Model Location:** `src/modules/question/question.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `word` (ObjectId, ref: Wordmanagement) — the word being tested
- `questionText` (String) — question prompt
- `options` (Array of String) — multiple-choice options
- `correctAnswer` (String) — the correct option
- `explanation` (String, optional) — why the answer is correct
- `difficulty` (String, enum: `easy`, `medium`, `hard`)
- `status` (String, enum: `active`, `inactive`)
- `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`

**Relationships:**
- Many-to-one: Wordmanagement
- Referenced by Quiz (array)

---

### 7. **SubscriptionPlan**
Pre-defined subscription tier configurations.

**Model Location:** `src/modules/subscriptionplan/subscriptionplan.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `name` (String, enum: `basic`, `pro`, `premium`) — plan name
- `description` (String) — plan features/benefits
- `price` (Number) — monthly price in cents (e.g., 999 = $9.99)
- `currency` (String, default: `USD`)
- `wordSwipeLimit` (Number) — monthly word lookups
- `aiChatLimit` (Number) — monthly AI interactions
- `features` (Array of String) — feature list
- `stripeProductId` (String) — Stripe product ID
- `stripePriceId` (String) — Stripe price ID
- `isDeleted` (Boolean)
- `createdAt`, `updatedAt`

**Relationships:**
- One-to-many: Subscription

---

### 8. **Subscription**
User subscription instances (billing & license records).

**Model Location:** `src/modules/subscription/subscription.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `userId` (ObjectId, ref: User) — subscriber
- `planId` (ObjectId, ref: SubscriptionPlan)
- `status` (String, enum: `pending`, `active`, `past_due`, `canceled`, `expired`, `failed`)
- `isDeleted` (Boolean)
- `currentPeriodStart` (Date) — billing cycle start
- `currentPeriodEnd` (Date) — billing cycle end
- `cancelAtPeriodEnd` (Boolean) — cancel after current period?
- `canceledAt` (Date, optional)
- `stripeCustomerId` (String) — Stripe customer ID
- `stripeSubscriptionId` (String) — Stripe subscription ID
- `stripeCheckoutSessionId` (String, optional) — Stripe session for checkout
- `latestInvoiceId` (String, optional) — last invoice ID
- `latestPaymentIntentId` (String, optional) — last payment intent
- `createdAt`, `updatedAt`

**Relationships:**
- Many-to-one: User
- Many-to-one: SubscriptionPlan

---

### 9. **Invoice**
Billing records for transactions.

**Model Location:** `src/modules/invoice/invoice.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `user` (ObjectId, ref: User)
- `subscription` (ObjectId, ref: Subscription, optional)
- `amount` (Number) — invoice total (in cents)
- `currency` (String, default: `USD`)
- `status` (String, enum: `pending`, `paid`, `failed`, `refunded`)
- `description` (String)
- `stripeInvoiceId` (String) — Stripe invoice ID
- `paidAt` (Date, optional)
- `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`

**Relationships:**
- Many-to-one: User
- Many-to-one: Subscription (optional)

---

### 10. **Notification**
In-app messages and alerts for users.

**Model Location:** `src/modules/notification/notification.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `user` (ObjectId, ref: User)
- `title` (String)
- `message` (String)
- `type` (String, enum: `info`, `warning`, `error`, `success`)
- `isRead` (Boolean)
- `actionUrl` (String, optional) — link to related resource
- `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`

**Relationships:**
- Many-to-one: User

---

### 11. **Learning**
User's learning progress and session records.

**Model Location:** `src/modules/learning/learning.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `user` (ObjectId, ref: User)
- `word` (ObjectId, ref: Wordmanagement)
- `category` (ObjectId, ref: CategoryWord)
- `status` (String, enum: `learning`, `reviewing`, `mastered`)
- `reviewCount` (Number) — times reviewed
- `lastReviewedAt` (Date)
- `createdAt`, `updatedAt`

**Relationships:**
- Many-to-one: User, Wordmanagement, CategoryWord

---

### 12. **Progress**
Aggregate learning metrics for users.

**Model Location:** `src/modules/progress/progress.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `user` (ObjectId, ref: User)
- `category` (ObjectId, ref: CategoryWord)
- `totalLearned` (Number)
- `totalMastered` (Number)
- `averageScore` (Number)
- `lastActivityAt` (Date)
- `createdAt`, `updatedAt`

**Relationships:**
- Many-to-one: User, CategoryWord

---

### 13. **Notebook**
User-generated notes and highlights.

**Model Location:** `src/modules/notebook/notebook.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `user` (ObjectId, ref: User)
- `word` (ObjectId, ref: Wordmanagement)
- `content` (String) — note text
- `tags` (Array of String) — custom tags
- `isStarred` (Boolean)
- `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`

**Relationships:**
- Many-to-one: User, Wordmanagement

---

### 14. **Chatbot**
Conversation logs with AI assistant.

**Model Location:** `src/modules/chatbot/chatbot.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `user` (ObjectId, ref: User)
- `messages` (Array of Object)
  - `role` (String, enum: `user`, `assistant`)
  - `content` (String)
  - `timestamp` (Date)
- `topic` (String, optional) — conversation context
- `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`

**Relationships:**
- Many-to-one: User

---

### 15. **Review**
User reviews and ratings for features/content.

**Model Location:** `src/modules/review/review.models.ts`

**Key Fields:**
- `_id` (ObjectId)
- `user` (ObjectId, ref: User)
- `word` (ObjectId, ref: Wordmanagement, optional)
- `category` (ObjectId, ref: CategoryWord, optional)
- `rating` (Number, 1–5)
- `comment` (String)
- `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`

**Relationships:**
- Many-to-one: User, Wordmanagement, CategoryWord

---

## Common Schema Patterns

### Auditing Fields
All models include:
```typescript
{
  createdAt: Date,     // auto-set on creation
  updatedAt: Date,     // auto-updated on change
  isDeleted: Boolean,  // soft delete flag
  deletedAt: Date | null  // soft delete timestamp
}
```

### Soft Deletes
Records are marked `isDeleted: true` rather than physically removed, allowing recovery and audit trails.

### Projections (Response Filtering)
Sensitive fields are excluded from API responses:
- `password`, `passwordResetToken`, `passwordResetExpire`
- `refreshToken`, `verificationOtp`, `verificationOtpExpire` (in User responses)

See `user.service.ts` for examples of safe `.select("-password -refreshToken …")`.

---

## Indexes
Key indexes for performance:

| Collection | Index | Reason |
|------------|-------|--------|
| User | `email` (unique) | fast login lookup |
| User | `provider`, `providerId` | OAuth identity |
| CategoryWord | `name` (unique) | prevent duplicates |
| Wordmanagement | `word` (unique) | dictionary lookup |
| Wordmanagement | `categoryWordId` | filter by category |
| Quiz | `user`, `category` | user quiz history |
| QuizAttempt | `user`, `quiz` | user attempt records |
| Subscription | `userId`, `planId` | user subscription state |
| Learning | `user`, `word`, `category` | fast progress queries |

---

## Data Relationships Diagram

```
User
 ├─ owns ─> Subscription (Many-to-one)
 ├─ owns ─> Quiz (Many-to-one)
 ├─ attempts ─> QuizAttempt (Many-to-one)
 ├─ learns ─> Learning (Many-to-one)
 ├─ owns ─> Progress (Many-to-one)
 ├─ owns ─> Notification (Many-to-one)
 ├─ owns ─> Notebook (Many-to-one)
 ├─ creates ─> Chatbot (Many-to-one)
 ├─ creates ─> Invoice (Many-to-one)
 └─ creates ─> Review (Many-to-one)

CategoryWord
 ├─ contains ─> Wordmanagement (One-to-many)
 ├─ tagged-in ─> Quiz (Many-to-many via question words)
 └─ referenced-in ─> Learning, Progress, Review

Wordmanagement
 ├─ tested-in ─> Question (One-to-many)
 ├─ taught-in ─> Learning (Many-to-one)
 ├─ noted-in ─> Notebook (Many-to-one)
 └─ reviewed-in ─> Review (Many-to-one)

SubscriptionPlan
 └─ bought-as ─> Subscription (One-to-many)

Quiz
 ├─ answered-in ─> QuizAttempt (One-to-one, optional)
 └─ contains ─> Question (Many-to-many via array)

Question
 └─ references ─> Wordmanagement
```

---

**Last Updated:** 2026-03-03
