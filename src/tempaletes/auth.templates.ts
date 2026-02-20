export const forgotPasswordOtpTemplate = (
  name: string,
  otp: string,
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #eef2ff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }

    .wrapper {
      padding: 40px 16px;
    }

    .card {
      max-width: 520px;
      margin: auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(79, 70, 229, 0.15);
      overflow: hidden;
    }

    .top-bar {
      height: 6px;
      background: linear-gradient(90deg, #6366f1, #22d3ee);
    }

    .content {
      padding: 32px 28px;
      color: #1f2937;
    }

    .logo {
      font-size: 20px;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 20px;
      text-align: center;
    }

    .content p {
      font-size: 15px;
      line-height: 1.7;
      margin: 0 0 18px;
      color: #374151;
    }

    .otp-section {
      text-align: center;
      margin: 30px 0;
    }

    .otp-label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .otp {
      display: inline-block;
      padding: 16px 36px;
      font-size: 30px;
      letter-spacing: 8px;
      font-weight: 800;
      color: #111827;
      background: linear-gradient(135deg, #eef2ff, #f8fafc);
      border-radius: 12px;
      border: 1px solid #e0e7ff;
    }

    .expiry {
      margin-top: 14px;
      font-size: 14px;
      color: #dc2626;
      font-weight: 600;
    }

    .note {
      font-size: 14px;
      color: #6b7280;
      background: #f9fafb;
      padding: 14px;
      border-radius: 10px;
      margin-top: 24px;
    }

    .footer {
      padding: 18px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      background: #f9fafb;
    }

    .brand {
      color: #4f46e5;
      font-weight: 600;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="card">
      <div class="top-bar"></div>

      <div class="content">
        <div class="logo">VIRUS COMPUTER</div>

        <p>Hi <strong>${name}</strong>,</p>

        <p>
          We received a request to reset your password.  
          Please use the verification code below to continue.
        </p>

        <div class="otp-section">
          <div class="otp-label">Your One-Time Password</div>
          <div class="otp">${otp}</div>
          <div class="expiry">⏳ Valid for 10 minutes only</div>
        </div>

        <div class="note">
          If you did not request a password reset, no action is required.
          Your account remains secure.
        </div>

        <p style="margin-top: 24px;">
          Regards,<br />
          <span class="brand">VIRUS COMPUTER Team</span>
        </p>
      </div>

      <div class="footer">
        This is an automated email. Please do not reply.
      </div>
    </div>
  </div>
</body>
</html>
`;
};

export const accountVerificationOtpEmailTemplate = (name: string, otp: string): string => {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">
    <h2 style="color:#2563eb; text-align:center;">Account Verification OTP</h2>

    <p>Hi <strong>${name}</strong>,</p>

    <p>Welcome to SwipeLang! Please use the OTP below to verify your account:</p>

    <div style="text-align:center; margin:30px 0;">
      <span style="font-size:28px; font-weight:bold; color:#2563eb; letter-spacing:2px;">
        ${otp}
      </span>
    </div>

    <p style="color:#dc2626; font-weight:600;">
      This OTP is valid for 1 minute only.
    </p>

    <p>If you did not create this account, please ignore this email.</p>

    <p>— SwipeLang Team</p>
  </div>
</body>
</html>
`;
};
export const otpEmailTemplate = (name: string, otp: string): string => {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">
    <h2 style="color:#2563eb; text-align:center;">Password Reset OTP</h2>

    <p>Hi <strong>${name}</strong>,</p>

    <p>We received a request to reset your password. Use the OTP below to proceed:</p>

    <div style="text-align:center; margin:30px 0;">
      <span style="font-size:28px; font-weight:bold; color:#2563eb; letter-spacing:2px;">
        ${otp}
      </span>
    </div>

    <p style="color:#dc2626; font-weight:600;">
      This OTP is valid for 1 minute only.
    </p>

    <p>If you didn’t request a password reset, please ignore this email.</p>

    <p>— SwipeLang Team</p>
  </div>
</body>
</html>
`;
};
