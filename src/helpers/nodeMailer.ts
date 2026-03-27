import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";
import CustomError from "./CustomError";

dotenv.config();

const HOST_MAIL = process.env.HOST_MAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;

// Create transporter with fast-fail timeouts so the server doesn't hang for 30+ seconds
const transporter: Transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS
  requireTLS: true,
  auth: {
    user: HOST_MAIL as string,
    pass: APP_PASSWORD as string,
  },
  connectionTimeout: 10000,  // fail after 10s if SMTP doesn't connect
  greetingTimeout: 10000,    // fail after 10s waiting for SMTP greeting
  socketTimeout: 15000,      // fail after 15s of socket inactivity
});

interface MailerOptions {
  subject: string;
  template: string;
  email: string;
}

export const mailer = async ({
  subject,
  template,
  email,
}: MailerOptions): Promise<void> => {
  // Fail fast if credentials are not configured
  if (!HOST_MAIL || !APP_PASSWORD) {
    throw new CustomError(501, "Mail service not configured. HOST_MAIL or APP_PASSWORD is missing.");
  }

  try {
    await transporter.sendMail({
      from: `"SwipeLang" <${HOST_MAIL}>`,
      to: email,
      subject,
      html: template,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown mail error";
    throw new CustomError(501, `Mail send failed: ${errMsg}`);
  }
};
