# Routes & Schemas

This document describes the data schemas and HTTP endpoints for the learning/chat features added to the backend.

---

## LearningHistory

Schema

- `user`: ObjectId (ref `User`) — required
- `lessonId`: ObjectId — required
- `progress`: Number — e.g., 0..100
- `lastAccessedAt`: Date

Index

- Unique compound index on `{ user, lessonId }`

Purpose

- Track per-user progress for a particular lesson.

Endpoints

- GET `/api/learning/history`
  - Query: `?userId=<id>&lessonId=<id>` (optional filters)
  - Auth: required
  - Response: list of learning history items (paginated)

- GET `/api/learning/history/:id`
  - Auth: required
  - Response: single history item

- POST `/api/learning/history`
  - Body: `{ lessonId: string, progress: number }`
  - Auth: required
  - Behavior: upsert a LearningHistory for `req.user` + `lessonId` (create or update)

- PATCH `/api/learning/history/:id`
  - Body: `{ progress?: number, lastAccessedAt?: Date }`
  - Auth: required (owner or admin)

- DELETE `/api/learning/history/:id`
  - Auth: admin or owner

---

## QuizAttempt

Schema

- `user`: ObjectId (ref `User`) — required
- `quizId`: ObjectId — required
- `answers`: Array of objects `{ questionId: ObjectId, selectedAnswer: string }`
- `score`: Number
- `createdAt`: Date (auto)

Purpose

- Store the user's submitted answers, computed score and timestamp.

Endpoints

- POST `/api/quiz-attempt/submit`
  - Body: `{ quizId: string, answers: [{ questionId, selectedAnswer }, ...] }`
  - Auth: required
  - Response: created QuizAttempt record (score included)

- GET `/api/quiz-attempt/:id`
  - Auth: owner or admin
  - Response: attempt details including answers and score

- GET `/api/quiz-attempt/user/:userId`
  - Auth: owner or admin
  - Query: pagination
  - Response: list of attempts for user

---

## ChatSession

Schema

- `user`: ObjectId (ref `User`) — required
- `sessionKey`: string — unique human / client-side identifier
- `createdAt`: Date

Purpose

- Track an active user chat session; messages reference the session.

Endpoints

- POST `/api/chat/session`
  - Body: `{ sessionKey?: string }` (optional) — server can generate a key
  - Auth: required
  - Response: `{ sessionId, sessionKey, createdAt }`

- GET `/api/chat/session/:id`
  - Auth: owner or admin
  - Response: session metadata

- GET `/api/chat/session/user/:userId`
  - Auth: owner or admin
  - Response: list of sessions for user

- DELETE `/api/chat/session/:id`
  - Auth: owner or admin
  - Behavior: soft-delete session and optionally messages

---

## ChatMessage

Schema

- `session`: ObjectId (ref `ChatSession`) — required
- `sender`: enum(`user`, `system`, `assistant`) — required
- `message`: string — required
- `createdAt`: Date

Purpose

- Store chat transcript lines associated with a `ChatSession`.

Endpoints

- POST `/api/chat/message`
  - Body: `{ sessionId: string, sender: "user" | "system" | "assistant", message: string }`
  - Auth: required (user must own session)
  - Response: created message

- GET `/api/chat/messages/:sessionId`
  - Auth: owner or admin
  - Query: `?limit=&offset=` or `?page=&limit=` for pagination
  - Response: list of messages (ordered by `createdAt` asc)

- DELETE `/api/chat/message/:id`
  - Auth: owner or admin
  - Behavior: soft-delete the message

---

## Notes & Best Practices

- All endpoints require authentication except where explicitly noted.
- Use request validation (`zod`) for body shapes (examples above) and guard ownership in controllers.
- Create compound indexes where needed (e.g., `{ user, lessonId }` unique for LearningHistory).
- For large chat transcripts consider archiving older messages or using a time-windowed query.

---

## Example DTOs

LearningHistory POST body

```json
{ "lessonId": "<ObjectId>", "progress": 42 }
```

QuizAttempt submit body

```json
{
  "quizId": "<ObjectId>",
  "answers": [{ "questionId": "<ObjectId>", "selectedAnswer": "A" }]
}
```

ChatMessage POST body

```json
{
  "sessionId": "<ObjectId>",
  "sender": "user",
  "message": "Explain the word 'abate'."
}
```

ChatSession POST body (create)

```json
{ "sessionKey": "optional-client-key" }
```
