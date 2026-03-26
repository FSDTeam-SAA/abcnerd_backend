export enum role {
  ADMIN = "admin",
  USER = "user",
}

export type AuthProvider = "local" | "google" | "kakao" | "apple";

export enum status {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
  // DELETED = "deleted",
  BANNED = "banned",
}

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  profession: string;
  profileImage: {
    public_id: string;
    secure_url: string;
  };
  status: status;
  selfIntroduction: string;
  city: string;
  country: string;
  passwordResetToken: string;
  passwordResetExpire: Date | null;
  isVerified: boolean;
  verificationOtp: string | null;
  verificationOtpExpire: Date | null;
  //daily goal
  dailyGoal: number;
  //auth provider
  provider: String;
  providerId: {
    type: String;
  };
  balance: {
    wordSwipe: number;
    aiChat: number;
    validityDate: Date;
  };

  subscription: {
    subscriptionId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    lastResetDate?: Date;
  };

  refreshToken: string | null;
  resetPassword: {
    otp: string | null;
    otpExpire: Date | null;
    token: string | null;
    tokenExpire: Date | null;
  };
  rememberMe: boolean;
  lastLogin: Date;
  comparePassword: (password: string) => Promise<boolean>;
  createAccessToken: () => string;
  createRefreshToken: () => string;
  generateResetPasswordToken(): string;
  verifyResetPasswordToken(token: string): any;
  updatePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean>;
}

export interface UpdateUserPayload {
  name?: string;
  selfIntroduction?: string;
  status?: status;
}

export interface AppleLoginResult {
  email: string;
  name?: string;
  accessToken: string;
  refreshToken: string;
}

export enum SubscriptionPlan {
  BASIC = "Basic",
  PRO = "Pro",
  PREMIUM = "Premium",
  UNLIMITED = "Unlimited",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  PENDING = "pending",
  FAILED = "failed",
  CANCELED = "cancelled",
}

// Daily balance limits per plan
export const PLAN_DAILY_LIMITS: Record<
  SubscriptionPlan,
  { wordSwipe: number; aiChat: number }
> = {
  [SubscriptionPlan.BASIC]: { wordSwipe: 10, aiChat: 5 },
  [SubscriptionPlan.PRO]: { wordSwipe: 30, aiChat: 15 },
  [SubscriptionPlan.PREMIUM]: { wordSwipe: 100, aiChat: 50 },
  [SubscriptionPlan.UNLIMITED]: { wordSwipe: Infinity, aiChat: Infinity },
};

// Extend your existing IUser interface with these fields
export interface ISubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date; // same as balance.validityDate — source of truth
  lastResetDate?: Date; // tracks when balance was last reset (prevents double-reset)
}
