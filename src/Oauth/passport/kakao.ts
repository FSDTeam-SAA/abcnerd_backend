// import passport from "passport";
// import { Strategy as KakaoStrategy } from "passport-kakao";
// import { userModel } from "../../modules/usersAuth/user.models";
// import config from "../../config";

// passport.use(
//     new KakaoStrategy(
//         {
//             clientID: config.provider.kakaoClientId as string,      // REST API Key
//             // clientSecret: config.provider.kakaoClientSecret, // optional
//             callbackURL: config.provider.kakaoRedirectUri as string,   // must match frontend redirect URI
//         },
//         async (accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
//             try {
//                 const email = profile._json.kakao_account?.email;
//                 const name = profile._json.kakao_account?.profile?.nickname;
//                 const profileImage = profile._json.kakao_account?.profile?.profile_image_url;
//                 const kakaoId = profile.id;

//                 if (!email) throw new Error("Kakao account has no email");

//                 let user = await userModel.findOne({ email });
//                 if (!user) {
//                     user = await userModel.create({
//                         email,
//                         name,
//                         provider: "kakao",
//                         providerId: kakaoId,
//                         profileImage: { public_id: "", secure_url: profileImage },
//                         isVerified: true,
//                     });
//                 }

//                 // Generate your JWT tokens
//                 const jwtAccessToken = user.createAccessToken();
//                 const jwtRefreshToken = user.createRefreshToken();
//                 user.refreshToken = jwtRefreshToken;
//                 await user.save();

//                 // Pass tokens and user info to next middleware
//                 return done(null, { user, accessToken: jwtAccessToken, refreshToken: jwtRefreshToken });
//             } catch (err) {
//                 return done(err);
//             }
//         }
//     )
// );

// export default passport;