import mongoose from "mongoose";
import chalk from "chalk";
import dotenv from "dotenv";
import config from "../config";
import {
  startBalanceResetCron,
  startPingServerCron,
} from "./balance-reset.cron";
import { startNotificationCron } from "./notification.cron";

dotenv.config();

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    console.log(chalk.gray("Using existing database connection"));
    return;
  }

  try {
    const mongoUrl = config.mongoUri;

    if (!mongoUrl) {
      throw new Error("MONGODB_URL is not defined in environment variables");
    }

    const dbinfo = await mongoose.connect(mongoUrl);

    // ✅ Temporary: Drop old conflicting indexes for chathistory (can be removed after one successful run)
    try {
      await mongoose.connection.db?.collection('dailychathistories').dropIndexes();
      console.log(chalk.blue("DailyChatHistory indexes dropped successfully."));
    } catch (e) {
      console.log(chalk.gray("No indexes found to drop or already dropped."));
    }

    console.log(
      chalk.yellow(`Database connection successful: ${dbinfo.connection.host}`),
    );

    // In serverless environments (like Vercel), node-cron will not work
    // as the process exits after the request finishes. We disable inline crons.
    if (!process.env.VERCEL) {
      startBalanceResetCron();
      //startPingServerCron();
      startNotificationCron();
    }
  } catch (error) {
    console.error(chalk.red("Database connection failed!!"), error);
    if (!process.env.VERCEL) {
      process.exit(1); // stop app if DB fails
    } else {
      throw error;
    }
  }
};
