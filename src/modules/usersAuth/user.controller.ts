// modules/user/user.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import config from "../../config";
import { userService } from "./user.service";

//TODO: Register user
export const registration = asyncHandler(async (req, res) => {
  const user = await userService.registerUser(req.body);
  ApiResponse.sendSuccess(res, 201, "User registered successfully, please check your email to activate your account within 2 minutes otherwise it will be deleted", {
    email: user.email,
    name: user.name,
  });
});

//TODO: Verify account by otp sent to email
export const verifyAccount = asyncHandler(async (req, res) => {
  const user = await userService.verifyAccount(req.body.email, req.body.otp);
  ApiResponse.sendSuccess(res, 200, "Accunt successfully verified", {
    email: user.email,
    name: user.name,
  });
});

//TODO: Login user
export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await userService.login(
    req.body.email,
    req.body.password,
  );

  if (config.env === "development") {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 15 // 15 days
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 30 // 10 minutes
    });
  }

  ApiResponse.sendSuccess(res, 200, "Logged in", {
    email: user.email,
    name: user.name,
    role: user.role,
    accessToken,
    refreshToken,
  });
});

//TODO: update user also profile image
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.updateUser(req);
  ApiResponse.sendSuccess(res, 200, "User updated successfully", {
    email: result.email,
    name: result.name,
    image: result.profileImage
  });
});

//TODO: update user status by id
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.updateStatus(req);
  ApiResponse.sendSuccess(res, 200, "User status updated successfully", result);
})

//TODO: update password
export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  await userService.updatePassword(req);
  ApiResponse.sendSuccess(
    res,
    200,
    "Password changed successfully. Please login again."
  );
});

//TODO: Logout user
export const logout = asyncHandler(async (req: Request, res: Response
) => {
  const { email } = req.user as { email: string };
  await userService.logout(email);

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");

  ApiResponse.sendSuccess(res, 200, "Logged out", {});
});

//TODO: forget password
export const forgetPassword = asyncHandler(async (req, res) => {
  const user = await userService.forgetPassword(req.body.email);
  ApiResponse.sendSuccess(res, 200, "Reset link sent to email", {
    email: user.email,
    name: user.name,
    message: "Reset password otp sent to your email",
  });
});

//TODO: verify otp
export const verifyOtpForgetPassword = asyncHandler(async (req, res) => {
  const { email, otp } = req.body
  const user = await userService.verifyOtp(email, otp);
  ApiResponse.sendSuccess(res, 200, "Otp is verified", {
    email: user.email,
    token: user?.resetPassword?.token
  });
});

//TODO: reset password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!token) throw new Error("Token not found");

  await userService.resetPassword(token as string, password);

  ApiResponse.sendSuccess(res, 200, "Password reset successful",);
});

//TODO: generate access token
export const generateAccessToken = asyncHandler(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.headers.refreshtoken?.toString().split("Bearer ")[1];

  const accessToken = await userService.generateAccessToken(refreshToken);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "none",
  });

  ApiResponse.sendSuccess(res, 201, "New access token generated", {
    accessToken
  });
});
