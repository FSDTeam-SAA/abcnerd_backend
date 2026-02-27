import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import { initSocket } from "./socket/server";
import routes from "./routes/index.api";
import { globalErrorHandler } from "./helpers/globalErrorHandler";
import {
  serverRunningTemplate,
} from "./tempaletes/serverlive.template";
import config from "./config";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import CustomError from "./helpers/CustomError";
import { notFound } from "./middleware/notFound";
import { googleLogin, kakaoLoginPage } from "./Oauth/google";
import { StripeWebhook } from "./modules/subscription/subscription.controller";
// import passport from "./Oauth/passport/kakao"; // not use a midlleware

const app = express();
const server = http.createServer(app);

if (config.env === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("short"));
}

app.use(cors({
  origin: ["*", "http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
  credentials: true
}));
app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  StripeWebhook
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(passport.initialize())

app.use("/api/v1", routes);

app.get("/google-test", googleLogin);
app.get("/kakao-test", kakaoLoginPage);

app.get("/", serverRunningTemplate);
app.use(notFound);

//global error handler
app.use(globalErrorHandler);

// Socket.IO setup
const io = initSocket(server);
export { io, server };
