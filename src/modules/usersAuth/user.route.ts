import { Router } from "express";
import {
  registration,
  verifyAccount,
  login,
  updateStatus,
  updatePassword,
  updateUser,
  logout,
  forgetPassword,
  verifyOtpForgetPassword,
  resetPassword,
  generateAccessToken,
} from "./user.controller";
import { allowRole, authGuard } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/multer.midleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import {
  forgetPasswordSchema,
  loginSchema,
  registerUserSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateStatusSchema,
  updateUserSchema,
  verifyAccountSchema,
  verifyOtpSchema,
} from "./user.validation";
import { rateLimiter } from "../../middleware/rateLimiter.middleware";

const router = Router();

router.post("/register-user", validateRequest(registerUserSchema), registration);

router.post("/login", rateLimiter(1, 5), validateRequest(loginSchema), login);

router.patch("/update-user", authGuard, upload.single("image"), validateRequest(updateUserSchema), updateUser);

router.patch("/update-status/:userId", authGuard, allowRole("admin"), validateRequest(updateStatusSchema), updateStatus);

router.patch("/update-password", authGuard, validateRequest(updatePasswordSchema), updatePassword);

router.post("/logout", authGuard, logout);

router.post("/forget-password", validateRequest(forgetPasswordSchema), forgetPassword);

router.post("/verify-otp", validateRequest(verifyOtpSchema), verifyOtpForgetPassword)

router.post("/reset-password/:token", validateRequest(resetPasswordSchema), resetPassword);

router.route("/verify-account").post(validateRequest(verifyAccountSchema), verifyAccount);

// token
router.post("/refresh-token", generateAccessToken);



export const userRoute = router;
