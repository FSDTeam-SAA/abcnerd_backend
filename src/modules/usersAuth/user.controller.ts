// modules/user/user.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import config from "../../config";
import { userService } from "./user.service";
import CustomError from "../../helpers/CustomError";

//: Register user
export const registration = asyncHandler(async (req, res) => {
  const user = await userService.registerUser(req.body);
  ApiResponse.sendSuccess(res, 201, "User registered successfully", {
    email: user.email,
    name: user.name,
  });
});

//: Verify account by otp sent to email
export const verifyAccount = asyncHandler(async (req, res) => {
  const user = await userService.verifyAccount(req.body.email, req.body.otp);
  ApiResponse.sendSuccess(res, 200, "Accunt successfully verified", {
    email: user.email,
    name: user.name,
  });
});

//: Login user
export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await userService.login(
    req.body.email,
    req.body.password,
    req?.body?.rememberMe
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
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    accessToken,
    refreshToken,
  });
});

//: get all users
export const getalluser = asyncHandler(async (req, res) => {

  const { users, meta } = await userService.getAllUsers(req);
  ApiResponse.sendSuccess(res, 200, "User fetched successfully", users, meta);
});

//: get single user
export const getSingleUser = asyncHandler(async (req, res) => {
  const { userId } = req?.params as { userId: string };
  const user = await userService.getUser(userId);
  ApiResponse.sendSuccess(res, 200, "User fetched successfully", user);
});
//: get my profile
export const getmyprofile = asyncHandler(async (req, res) => {
  const user = await userService.getmyprofile(req);
  ApiResponse.sendSuccess(res, 200, "Profile data fetched successfully", user);
});

//: update user also profile image
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.updateUser(req);
  ApiResponse.sendSuccess(res, 200, "User updated successfully", {
    email: result.email,
    name: result.name,
    // image: result.profileImage,
    city: result.city,
    country: result.country,
    profileImage: result.profileImage,
    dailyGoal: result.dailyGoal
  });
});

//: update user status by id
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.updateStatus(req);
  ApiResponse.sendSuccess(res, 200, "User status updated successfully", result);
})

//: update password
export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  await userService.updatePassword(req);
  ApiResponse.sendSuccess(
    res,
    200,
    "Password changed successfully. Please login again."
  );
});

//: Logout user
export const logout = asyncHandler(async (req: Request, res: Response
) => {
  const { email } = req.user as { email: string };
  await userService.logout(email);

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");

  ApiResponse.sendSuccess(res, 200, "Logged out", {});
});

//: forget password
export const forgetPassword = asyncHandler(async (req, res) => {
  const user = await userService.forgetPassword(req.body.email);
  ApiResponse.sendSuccess(res, 200, "Reset password otp sent to your email", {
    email: user.email,
    name: user.name,
    message: "Reset password otp sent to your email",
  });
});

//: verify otp
export const verifyOtpForgetPassword = asyncHandler(async (req, res) => {
  const { email, otp } = req.body
  const user = await userService.verifyOtp(email, otp);
  ApiResponse.sendSuccess(res, 200, "Otp is verified", {
    email: user.email,
    token: user?.resetPassword?.token
  });
});

//: reset password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!token) throw new Error("Token not found");

  await userService.resetPassword(token as string, password);

  ApiResponse.sendSuccess(res, 200, "Password reset successful",);
});

//: generate access token
export const generateAccessToken = asyncHandler(async (req, res) => {
  const refreshToken =
    // req.cookies?.refreshToken ||
    req.headers?.authorization?.toString().split("Bearer ")[1];

  if (!refreshToken) {
    throw new CustomError(401, "Refresh token not found");
  }

  const accessToken = await userService.generateAccessToken(refreshToken);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "none",
  });

  ApiResponse.sendSuccess(res, 201, "New access token generated", {
    accessToken
  });
});

//: Login With Google
export const loginWithGoogle = asyncHandler(async (req, res) => {
  const { email, name, accessToken, refreshToken } = await userService.loginWithGoogle(req.body.token);
  ApiResponse.sendSuccess(res, 200, "Logged in successfully", {
    email,
    name,
    accessToken,
    refreshToken
  });
});

//: login with kakao auth
export const loginWithKakao = asyncHandler(async (req, res) => {
  const { code, redirectUri } = req.body;
  if (!code) throw new Error("Code is missing, please sent code in request body");
  const { email, name, accessToken, refreshToken } = await userService.loginWithKakao(code, redirectUri);
  ApiResponse.sendSuccess(res, 200, "Logged in successfully", {
    email,
    name,
    accessToken,
    refreshToken
  });
});

//: login with apple auth
export const loginWithApple = asyncHandler(async (req, res) => {
  const { identityToken, userName } = req.body as { identityToken: string; userName: string };
  if (!identityToken) throw new Error("Identity token is missing, please sent identity token in request body");
  const { email, name, accessToken, refreshToken } = await userService.loginWithApple(identityToken, userName == "" ? undefined : userName);
  ApiResponse.sendSuccess(res, 200, "Logged in successfully", {
    email,
    name,
    accessToken,
    refreshToken
  });
});

//: update fcm token
export const updateFcmToken = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user as any;
  const { fcmToken } = req.body;

  if (!fcmToken) {
    throw new CustomError(400, "FCM token is required");
  }

  await userService.updateFcmToken(userId, fcmToken);

  ApiResponse.sendSuccess(res, 200, "FCM token updated successfully");
});