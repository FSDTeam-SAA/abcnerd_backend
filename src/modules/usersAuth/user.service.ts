// modules/user/user.service.ts
import { userModel } from "./user.models";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import CustomError from "../../helpers/CustomError";
import config from "../../config";
import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import { IUser, status, UpdateUserPayload } from "./user.interface";
import bcryptjs from "bcryptjs";
// import { redisTokenService } from "../../helpers/redisTokenService";
import { emailValidator } from "../../helpers/emailValidator";
import { generateOTP } from "../../utils/otpGenerator";
import { mailer } from "../../helpers/nodeMailer";
import { accountVerificationOtpEmailTemplate, otpEmailTemplate } from "../../tempaletes/auth.templates";
import { OAuth2Client } from "google-auth-library";

export const userService = {
  async registerUser(payload: Partial<IUser>) {
    if (payload.role === "admin")
      throw new CustomError(400, "Admin is reserved, you can't create admin");
    if (payload.email) {
      emailValidator(payload.email);
    }

    const adminEmails = config.adminEmails;
    const role = adminEmails.includes(payload.email!) ? "admin" : "user";
    const user = await userModel.create({
      ...payload,
      role: role,
    });

    if (role === "user") {
      const otp = generateOTP();
      await mailer({
        email: user.email,
        subject: "Account verification OTP",
        template: accountVerificationOtpEmailTemplate(user.name, otp),
      });
      user.verificationOtp = otp;
      //*** Delete user from database after 2 minutes if not verified ***
      user.verificationOtpExpire = new Date(Date.now() + 2 * 60 * 1000);
      await user.save();
    }
    return user;
  },

  async verifyAccount(email: string, otp: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "User not found, register again");

    if (!user.verificationOtp) throw new CustomError(400, "OTP not found");
    if (user.verificationOtp !== otp) throw new CustomError(400, "Invalid OTP");

    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpire = null;
    await user.save();
    return user;
  },

  async login(email: string, password: string, rememberMe: boolean = false) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "user not found");

    //check account status
    if (!user.isVerified) throw new CustomError(400, "Account not verified");

    const isPasswordMatch = await bcryptjs.compare(password, user.password);
    if (!isPasswordMatch) throw new CustomError(400, "incorrect password");

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    user.rememberMe = rememberMe;
    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  },

  async updateUser(req: any) {
    const data: UpdateUserPayload = req.body;
    const { email, role } = req?.user as { email: string; role: string };
    const image = req?.file as Express.Multer.File;

    // status handleing for user and admin
    if (data.status) {
      if (role === "admin") {
        // Admin can set any valid status
        if (!Object.values(status).includes(data.status as status)) {
          throw new CustomError(400, "Invalid status");
        }
      } else {
        // Regular user cannot set BLOCKED/BANNED
        if (![status.ACTIVE, status.INACTIVE].includes(data.status as status)) {
          throw new CustomError(
            403,
            `You are not allowed to set status to '${data.status}'`
          );
        }
      }
    }

    //find the user in database
    const user = await userModel.findOneAndUpdate({ email: email }, data, {
      new: true,
    });
    if (!user) throw new CustomError(400, "User not found");

    //upload the image
    if (image) {
      //delete the old image
      if (user.profileImage?.public_id) {
        await deleteCloudinary(user.profileImage?.public_id);
      }
      //upload the new image
      const result = await uploadCloudinary(image?.path);
      user.profileImage = result;
    }

    await user.save();
    return user
  },

  async updateStatus(req: any) {
    const { userId } = req?.params as { userId: string };
    const { status } = req.body as { status: status };

    const user = await userModel.findOneAndUpdate({ _id: userId }, { status }, {
      new: true,
    }).select("-password -passwordResetToken -passwordResetExpire -refreshToken -__v -createdAt -updatedAt -emailVerifiedAt -emailVerifiedOtp -verificationOtp -isDeleted");
    if (!user) throw new CustomError(400, "User not found");
    return user
  },

  // Service
  async updatePassword(req: any) {

    const { email } = req?.user as { email: string };
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

    const user = await userModel.findOne({ email: email });
    if (!user) {
      throw new CustomError(404, "User not found");
    }

    await user.updatePassword(currentPassword, newPassword);
    await user.save();

    return true
  },

  async logout(email: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "Email not found");

    // Clear refresh token from database
    user.refreshToken = "";
    await user.save();
  },

  async forgetPassword(email: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "User not found");

    // generate random token
    const otp = generateOTP()

    //sent otp to user
    await mailer({
      email: user.email,
      subject: "Reset your password - OTP",
      template: otpEmailTemplate(user.name, otp),
    });

    //save otp to database
    user.resetPassword.otp = otp;
    user.resetPassword.otpExpire = new Date(Date.now() + 2 * 60 * 1000);
    await user.save();



    return {
      email: user.email,
      name: user.name
    }
  },

  //verify otop
  async verifyOtp(email: string, otp: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "User not found");

    if (!user.resetPassword.otp) throw new CustomError(400, "OTP not found");
    if (user.resetPassword.otp !== otp) throw new CustomError(400, "Invalid OTP");

    if (!user.resetPassword.otpExpire || user.resetPassword.otpExpire < new Date(Date.now())) throw new CustomError(400, "OTP has been expired");

    user.isVerified = true;
    user.resetPassword.otp = null;
    user.resetPassword.otpExpire = null;
    user.resetPassword.token = user.generateResetPasswordToken();
    await user.save();

    return user
  },


  async resetPassword(token: string, password: string) {
    //decode token
    const decoded = jwt.verify(token, config.passwordResetTokenSecret as string) as jwt.JwtPayload;
    if (!decoded) throw new CustomError(400, "Invalid token");

    //find user
    const user = await userModel.findOne({ email: decoded.email });
    if (!user) throw new CustomError(400, "User not found");
    //update password

    //password compare can't be same as old
    const isMatch = await user.comparePassword(password);
    if (isMatch) {
      throw new CustomError(400, "New password must be not similar as old password");
    }

    user.password = password;
    user.resetPassword.token = null;
    await user.save();

    return true;
  },


  async generateAccessToken(refreshToken: string) {
    const decoded = jwt.verify(
      refreshToken,
      config.jwt.refreshTokenSecret,
    ) as jwt.JwtPayload;

    if (!decoded?.userId) {
      throw new CustomError(401, "Invalid refresh token");
    }

    const user = await userModel.findById(decoded.userId);
    if (!user) throw new CustomError(400, "User not found");
    if (user.refreshToken !== refreshToken) {
      throw new CustomError(401, "Invalid refresh token");
    }
    const accessToken = user.createAccessToken();
    return accessToken;
  },



  //TODO: login with google
  async loginWithGoogle(token: string) {
    // Initialize Google OAuth client
    const client = new OAuth2Client(config.provider.googleClientId);

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.provider.googleClientId as string,
    });

    // Extract user information
    const { email, name, picture } = ticket.getPayload() as { email: string; name: string; picture: string; };

    // Find or create user in your database
    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({ email, name, authProvider: "google", profileImage: { public_id: picture }, isVerified: true });
    }

    // Generate access token
    const accessToken = user.createAccessToken();
    // Generate refresh token
    const refreshToken = user.createRefreshToken();


    // Save refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    return {
      email,
      name,
      accessToken,
      refreshToken
    };
  }
};
