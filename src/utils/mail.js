import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import Mailgen from "mailgen";
import logger from "../logger/winston.logger.js";

const FROM_EMAIL = process.env.MAILUSER;
const FROM_NAME = process.env.MAIL_FROM_NAME || "AuthMicroservice";
const PASSKEY = process.env.MAILPASS;
const SMTP_HOST = process.env.SMTP_HOST || "smtp.office365.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;

const MAX_ATTACHMENT_SIZE = 3 * 1024 * 1024; // 3MB

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: FROM_EMAIL,
    pass: PASSKEY,
  },
});

const getProductLink = () => {
  const link = process.env.PRODUCT_DOCS_URL;
  if (!link) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "PRODUCT_DOCS_URL environment variable is required in production",
      );
    }
    return "http://localhost:8080/docs";
  }
  return link;
};

async function buildAttachments(filePaths) {
  const attachments = [];

  for (const filePath of filePaths) {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size > MAX_ATTACHMENT_SIZE) {
        throw new Error(
          `File ${path.basename(filePath)} exceeds ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB limit`,
        );
      }
      const content = await fs.promises.readFile(filePath);
      attachments.push({
        filename: path.basename(filePath),
        content,
      });
    } catch (err) {
      if (err.code === "ENOENT") {
        const newError = new Error(`Attachment file not found: ${filePath}`);
        newError.cause = err;
        throw newError;
      }
      throw err;
    }
  }

  return attachments;
}

export async function sendEmail(
  to_emails,
  subject,
  mailBody,
  cc_emails = [],
  filePaths = [],
) {
  try {
    const toRecipients = Array.isArray(to_emails) ? to_emails : [to_emails];
    const ccRecipients =
      cc_emails.length > 0
        ? Array.isArray(cc_emails)
          ? cc_emails
          : [cc_emails]
        : [];

    const attachments =
      filePaths.length > 0 ? await buildAttachments(filePaths) : [];

    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: toRecipients.join(", "),
      cc: ccRecipients.length > 0 ? ccRecipients.join(", ") : undefined,
      subject,
      html: mailBody,
      attachments,
    });

    return {
      flag: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logger.error("Email send failed", {
      to: to_emails,
      subject,
      error: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
    });
    return {
      flag: false,
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
      },
    };
  }
}

export const forgotPasswordOtpMailgenContent = (userName, otp) => {
  const productLink = getProductLink();
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "AuthMicroservice",
      link: productLink,
    },
  });

  return mailGenerator.generate({
    body: {
      name: userName,
      intro: [
        "We received a request to reset your password. Please use the following One-Time Password (OTP) to set your new password.",
        "This OTP is valid for 5 minutes and can be used only once.",
        `<h2 style="color:#2c3e50; text-align:center; letter-spacing:2px;">${otp}</h2>`,
      ],
      outro:
        "If you did not request a password reset, please ignore this email.",
    },
  });
};

export const newUserRegisterMailgen = (userName, email, setupLink) => {
  const productLink = getProductLink();
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "AuthMicroservice",
      link: productLink,
    },
  });

  return mailGenerator.generate({
    body: {
      name: userName,
      intro:
        "Welcome to AuthMicroservice! Your account has been successfully created.",
      table: {
        data: [
          {
            Email: email,
          },
        ],
        columns: {
          customWidth: {
            Email: "100%",
          },
          customAlignment: {
            Email: "left",
          },
        },
      },
      action: {
        instructions:
          "To set up your password and get started, click the button below:",
        button: {
          color: "#22BC66",
          text: "Set Password",
          link: setupLink,
        },
      },
      outro:
        "This is a one-time setup link. It will expire in 24 hours.\n\nNeed help? Feel free to reply to this email. We're happy to assist you!",
    },
  });
};
