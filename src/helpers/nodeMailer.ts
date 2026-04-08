import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import axios from 'axios';
import config from '../config';

dotenv.config();
interface MailerOptions {
  subject: string;
  template: string;
  email: string;
}

console.log(config.brevo.auth.user, config.brevo.auth.pass);


// Create transporter
const transporter: Transporter = nodemailer.createTransport({
  host: config.brevo.host,
  port: config.brevo.port,
  secure: config.brevo.port === 587 ? false : true, // Always false for port 587
  auth: {
    user: config.brevo.auth.user,
    pass: config.brevo.auth.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Mailer function
export const mailer = async ({ subject, template, email }: MailerOptions): Promise<void> => {
  try {
    // First try SMTP
    const info = await transporter.sendMail({
      from: `${config.brevo.senderName} <${config.brevo.senderEmail}>`,
      to: email,
      subject,
      html: template,
    });

    if (config.env === 'development') {
      console.log('Email sent successfully via SMTP:', info.messageId);
    }
  } catch (smtpError) {
    if (config.env === 'development') {
      console.error('SMTP connection failed:', smtpError);
      return
    }

    // try {
    //       // Fallback to Brevo API
    //       const response = await axios.post(
    //             'https://api.brevo.com/v3/smtp/email',
    //             {
    //                   sender: {
    //                         name: config.brevo.senderName || 'Dream Builders',
    //                         email: config.brevo.senderEmail || 'sabbir.dev001@gmail.com',
    //                   },
    //                   to: [{ email }],
    //                   subject,
    //                   htmlContent: template,
    //             },
    //             {
    //                   headers: {
    //                         'api-key': config.brevo.auth.apiKey,
    //                         'Content-Type': 'application/json',
    //                   },
    //             }
    //       );

    //       if (response.status !== StatusCodes.OK && response.status !== StatusCodes.CREATED) {
    //             throw new AppError(500, 'Failed to send email via Brevo API');
    //       }

    //       if (config.env === 'development') {
    //             //console.log('Email sent via Brevo API:', response.data);
    //       }
    // } catch (apiError) {
    //       console.error('Brevo API fallback failed:', apiError);
    //       throw new AppError(500, 'Failed to send email via SMTP and API');
    // }
  }
};


// //!Use breve email service webhook if nodemailer is not working
// export const mailer = async ({ subject, template, email }: MailerOptions): Promise<void> => {
//       const response = await axios.post(
//             'https://api.brevo.com/v3/smtp/email',
//             {
//                   sender: { name: 'Dream Builders', email: 'sabbir.dev001@gmail.com' },
//                   to: [{ email: email }],
//                   subject,
//                   htmlContent: template,
//             },
//             {
//                   headers: {
//                         'api-key': config.brevo.auth.apiKey,
//                         'Content-Type': 'application/json',
//                   },
//             }
//       );

//       config.env === 'development' && //console.log(response.data);
// };