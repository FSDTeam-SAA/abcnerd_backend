**Project Overview**
- **Name:** ABCNerd backend
- **Purpose:** REST API backend for the ABCNerd learning app (users, word management, quizzes, subscriptions, notifications, etc.).

**Prerequisites**
- Node.js (v18+ recommended)
- npm (v9+ recommended)
- MongoDB (Atlas or local)
- Redis (optional, for rate-limiting/session)

**Quick Setup**

1. Install dependencies:

```bash
npm install
```

2. Create an environment file from the example:

```bash
cp .env.example .env
# then edit .env to add real values
```

3. Run the app in development:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
npm run start
```

**Repository layout (important parts)**
- `src/` – source code (controllers, services, models, routes, utils)
- `src/modules/` – feature modules (usersAuth, wordmanagement, quiz, etc.)
- `src/config/` – runtime configuration
- `src/database/` – database connection and cron jobs
- `scripts/` – helper scripts (seeders, module scaffolding)

**Environment variables**
See `.env.example` for all required keys. Do not commit real keys.

**Database schema explanation**
This section summarizes the primary collections and main fields. It is a compact reference (not full Mongoose schema details):

- **Users**
  - Key fields: `email`, `name`, `password` (hashed), `role` (`user|admin`), `provider` (`local|google|kakao|apple`), `refreshToken`, `isVerified`, `status`
  - Relationships: users own progress, quizzes, invoices and subscriptions.

- **CategoryWord**
  - Key fields: `name`, `description`, `status`.
  - Purpose: grouping for words (e.g., topic, level).

- **Wordmanagement**
  - Key fields: `word`, `description`, `examples` (array), `synonyms`, `partOfSpeech`, `tags`, `frequency`, `categoryWordId` (ref)
  - Purpose: main dictionary entries used by quizzes and learning flows.

- **Quiz & QuizAttempt**
  - `Quiz` contains metadata and question list; `QuizAttempt` stores user answers, score and progress.

- **SubscriptionPlan & Subscription**
  - Plans define pricing durations/features; Subscription stores user's active plan, status, renewal dates.

- **Notification / Invoice / Notebook / Progress**
  - Support collections for messaging, billing, user notes and learning progress.

Notes:
- Most models include common auditing fields: `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`.
- Sensitive fields (password, refreshToken, password reset tokens) are excluded by projection in responses — see `user.service` methods.

**Requirements → Implementation mapping**

- Requirement: User registration, verification, login, social login, password reset
  - Implemented in: `src/modules/usersAuth/*` (`user.controller.ts`, `user.service.ts`, `user.models.ts`)
  - Notes: JWT tokens, refresh token handling, cookies and social providers (Google, Kakao, Apple) are supported.

- Requirement: Word storage and management with filtering, search, categories
  - Implemented in: `src/modules/wordmanagement/*` and `src/modules/categoryword/*`
  - Notes: Endpoints include pagination, search, status filter and create/update/delete flows.

- Requirement: Quizzes, attempts and scoring
  - Implemented in: `src/modules/quiz*` and `src/modules/quizattempt*`

- Requirement: Subscriptions and payments
  - Implemented in: `src/modules/subscription*` and `src/lib/stripe.ts`

- Requirement: Notifications, invoices and notebook
  - Implemented in respective modules under `src/modules/`

**Important implementation notes & recommendations**
- Types: Many places currently use `any`. Recommended fixes: add `RequestWithUser` types, strongly type service return values, and replace `any` in `apiResponse`/`asyncHandler`.
- Security: centralise cookie options in config and ensure `secure`/`httpOnly` are set appropriately for production.
- Tests: add unit tests for auth flows and pagination; add CI (GitHub Actions) to run `npm run build` and tests.

**How to export a ZIP of the backend**

From the repository root run:

```bash
zip -r abcnerd-backend.zip . -x node_modules/**\* dist/**\* .git/**\* .env
```

Or on Windows (PowerShell):

```powershell
Compress-Archive -Path * -DestinationPath ..\abcnerd-backend.zip -Force
```

**Files included in the ZIP**
- All files under `src/`, `package.json`, `tsconfig.json`, `scripts/`, and the generated `README.md` and `.env.example`.

**Where to look first in the code**
- Authentication: src/modules/usersAuth/user.service.ts
- API error and response shape: src/utils/apiResponse.ts and src/helpers/CustomError.ts
- Word management and validation: src/modules/wordmanagement/wordmanagement.service.ts and src/modules/wordmanagement/wordmanagement.validation.ts

**Contact / Next steps**
- If you want, I can:
  - generate the ZIP for you, or
  - perform the `any` → typed refactor for the user module first, or
  - add a simple GitHub Actions CI that runs `npm run build`.

---
Generated on: 2026-03-03
# Boilerplate Web Node.js TypeScript

A robust and scalable Node.js backend boilerplate built with TypeScript, Express, and MongoDB. This project provides a solid foundation for building web applications with authentication, file uploads, real-time features, and more.

## 🚀 Features

- **TypeScript** - Full TypeScript support for type safety
- **Express.js** - Fast and minimalist web framework
- **MongoDB with Mongoose** - Database integration with ODM
- **JWT Authentication** - Secure token-based authentication
- **Socket.IO** - Real-time bidirectional communication
- **File Upload** - Cloudinary integration for file storage
- **Email Service** - Nodemailer for email notifications
- **Validation** - Zod for request validation
- **Error Handling** - Comprehensive error handling system
- **Environment Configuration** - Secure environment variable management
- **CORS** - Cross-origin resource sharing enabled
- **Cookie Parser** - HTTP cookie management
- **BCrypt** - Password hashing and security
- **ESLint & Prettier** - Code linting and formatting

## 📦 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd TS_BoilerPlate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Configure all required environment variables:

   ```env
   # Server
   NODE_ENV=development
   PORT=5000

   # Database
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority

   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=1h
   ACCESS_TOKEN_SECRET=your_access_token_secret
   ACCESS_TOKEN_EXPIRES=7d
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_EXPIRES=90d

   # Bcrypt
   BCRYPT_SALT_ROUNDS=10

   # Cloudinary (for file uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Email (Nodemailer)
   EMAIL_EXPIRES=900000
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_ADDRESS=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=your_email@gmail.com
   EMAIL_TO=""
   ADMIN_EMAIL=admin@example.com

   # Frontend
   FRONTEND_URL=http://localhost:3000
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
Runs the server with hot-reload using `ts-node-dev`.

### Production Build
```bash
npm run build
npm start:prod
```
Compiles TypeScript to JavaScript and runs the production server.

### Other Scripts
```bash
npm run lint          # Run ESLint
npm run lint:fix      # Fix linting issues
npm run prettier      # Format code with Prettier
npm run prettier:fix  # Fix formatting issues
```

## 📁 Project Structure

```
src/
├── config/              # Environment & app config
├── helpers/             # Utilities (CustomError, asyncHandler)
├── middlewares/         # Auth, error, rate limit
├── modules/
│   ├── auth/            # Auth logic
│   ├── user/            # User module
├── routes/              # API routes
├── socket/              # Socket.IO logic
├── utils/               # Helpers
├── app.ts               # Express setup
└── server.ts            # App entry

```

## 🔌 API Endpoints

### Authentication Routes (`/api/v1/auth`)
- `POST /register` - User registration with email verification
- `POST /verify-email` - Verify email with OTP
- `POST /login` - User login
- `POST /refresh-token` - Refresh access token
- `POST /forgot-password` - Request password reset OTP
- `POST /reset-password` - Reset password with OTP
- `POST /logout` - User logout


## 📧 Email Templates

The project includes email templates for:
- OTP verification (registration and password reset)
- User creation confirmation
- Welcome emails

## 🔄 Real-time Features

Socket.IO is integrated for real-time functionality:
- Chat messaging
- Real-time notifications
- Live updates

## 🗃️ Database Models

### User Model
```typescript
{
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  profileImage?: string;
  otp?: string;
  otpExpiry?: Date;
  verified?: boolean;
}
```

## 🔧 Configuration

### Environment Variables
All sensitive configuration is managed through environment variables. See the `.env.example` file for all required variables.

### Cloudinary Setup
For file uploads, configure your Cloudinary credentials in the environment variables.

### Email Service
Configure your email service provider (Gmail recommended for development) in the environment variables.

## 🧪 Testing

To add tests to the project:

1. Install testing dependencies:
   ```bash
   npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
   ```

2. Create a `jest.config.js` file
3. Add test scripts to package.json

## 📦 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start:prod
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check that all required ports are available

## 🔗 Useful Links

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Socket.IO Documentation](https://socket.io/)
- [Cloudinary Documentation](https://cloudinary.com/)

---

**Happy Coding!** 🎉