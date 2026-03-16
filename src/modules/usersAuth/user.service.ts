// modules/user/user.service.ts
import { userModel } from "./user.models";
import jwt from "jsonwebtoken";
import CustomError from "../../helpers/CustomError";
import config from "../../config";
import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import { AppleLoginResult, AuthProvider, IUser, role, status, UpdateUserPayload } from "./user.interface";
import bcryptjs from "bcryptjs";
// import { redisTokenService } from "../../helpers/redisTokenService";
import { emailValidator } from "../../helpers/emailValidator";
import { generateOTP } from "../../utils/otpGenerator";
import { mailer } from "../../helpers/nodeMailer";
import { accountVerificationOtpEmailTemplate, otpEmailTemplate } from "../../tempaletes/auth.templates";
import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";
import axios from "axios";
import { paginationHelper } from "../../utils/pagination";

export const userService = {
  //register
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

    // if (role === "user") {
    //   const otp = generateOTP();
    //   await mailer({
    //     email: user.email,
    //     subject: "Account verification OTP",
    //     template: accountVerificationOtpEmailTemplate(user.name, otp),
    //   });
    //   user.verificationOtp = otp;
    //   //*** Delete user from database after 2 minutes if not verified ***
    //   user.verificationOtpExpire = new Date(Date.now() + 2 * 60 * 1000);
    //   await user.save();
    // }
    return user;
  },

  //verify account
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

  //login
  async login(email: string, password: string, rememberMe: boolean = false) {
    const user = await userModel.findOne({ email: email, provider: "local" }).select("+password");
    if (!user) throw new CustomError(400, "user not found");

    //check account status
    // if (!user.isVerified) throw new CustomError(400, "Account not verified");


    const isPasswordMatch = await bcryptjs.compare(password, user.password);
    if (!isPasswordMatch) throw new CustomError(400, "incorrect password");

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    user.rememberMe = rememberMe;
    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  },

  //get all users
  async getAllUsers(req: any) {
    const {
      role: roleParam,
      status: statusParam,
      provider,
      search,
      page: pagebody,
      limit: limitbody,
    } = req.query;

    const { page, limit, skip } = paginationHelper(pagebody, limitbody);

    const filter: any = {};

    // ROLE filter + validation
    // if you want to allow role=all
    const allowedRoles = [...Object.values(role), "all"] as const;

    if (roleParam && !allowedRoles.includes(roleParam)) {
      throw new CustomError(
        400,
        `Invalid role "${roleParam}". Allowed roles: ${allowedRoles.join(", ")}`
      );
    }

    if (roleParam && roleParam !== "all") {
      filter.role = roleParam;
    }

    // STATUS filter + validation
    // if you want to allow status=all
    const allowedStatuses = [...Object.values(status), "all"] as const;

    if (statusParam && !allowedStatuses.includes(statusParam)) {
      throw new CustomError(
        400,
        `Invalid status "${statusParam}". Allowed status: ${allowedStatuses.join(", ")}`
      );
    }

    if (statusParam && statusParam !== "all") {
      filter.status = statusParam;
    }

    // PROVIDER filter + validation
    const allowedProviders: AuthProvider[] = ["local", "google", "kakao", "apple"];

    if (provider && !allowedProviders.includes(provider as AuthProvider)) {
      throw new CustomError(
        400,
        `Invalid provider "${provider}". Allowed providers: ${allowedProviders.join(", ")}`
      );
    }

    if (provider) {
      filter.provider = provider;
    }

    //SEARCH filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }


    const [users, totalUsers] = await Promise.all([
      userModel.find(filter).skip(skip).limit(limit).select("-password -passwordResetToken -passwordResetExpire -refreshToken -__v -createdAt -updatedAt -emailVerifiedAt -emailVerifiedOtp -verificationOtp -verificationOtpExpire -isDeleted -deletedAt -rememberMe"),
      userModel.countDocuments(filter),
    ]);

    return {
      users,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
        total: totalUsers,
      },
    };
  },

  //get single user
  async getUser(userId: string) {
    const user = await userModel.findOne({ _id: userId }).select("-password -passwordResetToken -passwordResetExpire -refreshToken -__v -createdAt -updatedAt -emailVerifiedAt -emailVerifiedOtp -verificationOtp -verificationOtpExpire -isDeleted -deletedAt -rememberMe ");
    if (!user) throw new CustomError(400, "User not found");
    return user;
  },
  //get single user
  async getmyprofile(req: any) {
    const { email } = req?.user as { email: string };
    const user = await userModel.findOne({ email: email }).select("-password -passwordResetToken -passwordResetExpire -refreshToken -__v -createdAt -updatedAt -emailVerifiedAt -emailVerifiedOtp -verificationOtp -verificationOtpExpire -isDeleted -deletedAt -rememberMe ");
    if (!user) throw new CustomError(400, "User not found");
    return user;
  },

  //update user
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
      returnDocument: "after",
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

  //update user status by admin 
  async updateStatus(req: any) {
    const { userId } = req?.params as { userId: string };
    const { status } = req.body as { status: status };

    const user = await userModel.findOneAndUpdate({ _id: userId }, { status }, {
      returnDocument: "after",
    }).select("-password -passwordResetToken -passwordResetExpire -refreshToken -__v -createdAt -updatedAt -emailVerifiedAt -emailVerifiedOtp -verificationOtp -isDeleted");
    if (!user) throw new CustomError(400, "User not found");
    return user
  },

  //update password
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

  //logout
  async logout(email: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "Email not found");

    // Clear refresh token from database
    user.refreshToken = "";
    await user.save();
  },

  //forget password
  async forgetPassword(email: string) {
    const user = await userModel.findOne({ email: email, provider: "local" });
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

  //reset password
  async resetPassword(token: string, password: string) {
    //decode token
    const decoded = jwt.verify(token, config.passwordResetTokenSecret as string) as jwt.JwtPayload;
    if (!decoded) throw new CustomError(400, "Invalid token");

    //find user
    const user = await userModel.findOne({ email: decoded.email });
    if (!user) throw new CustomError(400, "User not found");

    if (!user.resetPassword.token) throw new CustomError(400, "There is no request to reset password");

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

  //generate access token
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

  //: login with google
  async loginWithGoogle(token: string) {
    // Initialize Google OAuth client
    const client = new OAuth2Client(config.provider.googleClientId);

    // Accept tokens from Web, iOS, and Android clients
    const allowedAudiences = [
      config.provider.googleClientId,
      config.provider.googleIosClientId,
      config.provider.googleAndroidClientId,
    ].filter(Boolean) as string[];

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: allowedAudiences,
    });

    // Extract user information
    const { email, name, picture } = ticket.getPayload() as { email: string; name: string; picture: string; };

    // Find or create user in your database
    let user = await userModel.findOne({ email: email, provider: "google" });
    if (!user) {
      user = await userModel.create({ email, name, provider: "google", profileImage: { public_id: picture }, isVerified: true });
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
  },

  //: login with google
  async loginWithKakao(code: string) {
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: config.provider.kakaoClientId,
          redirect_uri: config.provider.kakaoRedirectUri,
          code,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (tokenResponse.status !== 200) {
      throw new Error("Failed to get access token");
    }

    const { access_token } = tokenResponse.data as { access_token: string };

    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (userResponse.status !== 200) {
      throw new Error("Failed to get user information");
    }

    const kakaoUser: any = userResponse.data;
    const kakaoId = kakaoUser.id?.toString();
    const name = kakaoUser.kakao_account?.profile?.nickname || `kakao_${kakaoId}`;
    const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url;
    // Kakao does not strictly guarantee an email address.
    const email = kakaoUser.kakao_account?.email || `${kakaoId}@kakao.dummy.com`;

    // 1. First, try to find the user strictly by their Kakao provider ID.
    let user = await userModel.findOne({ providerId: kakaoId, provider: "kakao" });

    // 2. If not found by providerId, try to find by email (to link an existing local account, for example).
    if (!user) {
      user = await userModel.findOne({ email });
    }

    // If user still doesn't exist, create a new one matching the Schema requirements
    if (!user) {
      user = await userModel.create({
        email,
        name,
        provider: "kakao",
        providerId: kakaoId,
        profileImage: { public_id: "", secure_url: profileImage },
        isVerified: true,
      });
    }

    // Generate access token and refresh token
    const jwtAccessToken = user.createAccessToken();
    const jwtRefreshToken = user.createRefreshToken();
    user.refreshToken = jwtRefreshToken;
    await user.save();

    return { email, name, accessToken: jwtAccessToken, refreshToken: jwtRefreshToken };
  },

  //: login with apple
  async loginWithApple(identityToken: string, userName?: string): Promise<AppleLoginResult> {
    // Verify identity token
    const applePayload: any = await appleSignin.verifyIdToken(identityToken, {
      audience: config.provider.appleClientId, // your Apple Service ID
      ignoreExpiration: false,
    });

    // Extract email & name
    const email = applePayload.email;
    const name = userName || applePayload.name || "Apple User"; // frontend sends name only on first login
    const appleId = applePayload.sub;

    if (!email) throw new Error("Apple ID token did not provide email");

    //  Find or create user
    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({
        email,
        name,
        provider: "apple",
        providerId: appleId,
        profileImage: { public_id: "", secure_url: "" },
        isVerified: true,
      });
    }

    // Generate access token
    const jwtAccessToken = user.createAccessToken();
    const jwtRefreshToken = user.createRefreshToken();
    user.refreshToken = jwtRefreshToken;
    await user.save();

    return { email, name, accessToken: jwtAccessToken, refreshToken: jwtRefreshToken };

  }
};
