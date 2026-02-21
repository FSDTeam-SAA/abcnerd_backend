export enum role {
  ADMIN = "admin",
  USER = "user",
}

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
  profileImage:
  {
    public_id: string;
    secure_url: string;
  },
  status: status;
  selfIntroduction: string;
  addressIds?: string[];
  passwordResetToken: string;
  passwordResetExpire: Date | null;
  isVerified: boolean;
  verificationOtp: string | null;
  verificationOtpExpire: Date | null;
  //auth provider
  googleId: string | null;
  facebookId: string | null;
  authProvider: string | null;

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