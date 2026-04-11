import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import { initSocket } from "./socket/server";
import routes from "./routes/index.api";
import { globalErrorHandler } from "./helpers/globalErrorHandler";
import { serverRunningTemplate } from "./tempaletes/serverlive.template";
import config from "./config";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import CustomError from "./helpers/CustomError";
import { notFound } from "./middleware/notFound";
import { googleLogin, kakaoLoginPage } from "./Oauth/google";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

// import passport from "./Oauth/passport/kakao"; // not use a midlleware

const app = express();
const server = http.createServer(app);

if (config.env === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("short"));
}

app.use(
  cors({
    origin: [
      "*",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "https://abcneard-admin-dahsboard.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter specifically to auth and learning critical paths
app.use("/api/v1/auth", limiter);
app.use("/api/v1/learning", limiter);

app.get("/health", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "ok",
    environment: config.env,
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});
app.use(cookieParser());
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
export default app;
