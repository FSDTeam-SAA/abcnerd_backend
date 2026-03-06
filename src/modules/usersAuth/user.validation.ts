import { z } from "zod";
import { role, status } from "./user.interface";

export const registerUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(16, "Password must be at most 16 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
      ),
    role: z.enum(["user", "admin"]).default("user").optional(),
  })
  .strict();

//verify account schema
export const verifyAccountSchema = z
  .object({
    email: z.email("Invalid email address"),

    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only numbers"),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(16, "Password must be at most 16 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
      ),
    rememberMe: z.boolean().default(false).optional(),
  })
  .strict();

//update user info schema
export const updateUserSchema = z
  .object({
    // Basic info
    name: z.string().min(1, "Name cannot be empty").optional(),
    selfIntroduction: z
      .string()
      .max(100, "Self introduction cannot be longer than 100 characters")
      .optional(),
    status: z.enum(Object.values(status) as [string, ...string[]]).optional(),
  })
  .strict();

export const updateStatusSchema = z
  .object({
    status: z.enum(Object.values(status) as [string, ...string[]]).optional(),
  })
  .strict();

export const forgetPasswordSchema = z
  .object({
    email: z.email("Invalid email address"),
  })
  .strict();

export const verifyOtpSchema = z
  .object({
    email: z.string().email("Invalid email address"),

    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only numbers"),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(16, "Password must be at most 16 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
      ),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(16, "Password must be at most 16 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
      ),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// export const refreshTokenSchema = z
//   .object({
//     refreshToken: z.string().min(1, "Refresh token required").optional(),
//   })
//   .strict();

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(16, "Password must be at most 16 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
      ),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(16, "Password must be at most 16 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
      ),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
    path: ["password"],
  });
