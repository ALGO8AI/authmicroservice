import axios from "axios";
import fs from "fs";
import path from "path";
import Mailgen from "mailgen";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const username = process.env.MAIL;
const tenantId = process.env.MAIL_TENANT_ID;

// ─── Helpers ────────────────────────────────────────────────────────────────────

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

const MAX_ATTACHMENT_SIZE = 3 * 1024 * 1024; // 3MB

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
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: path.basename(filePath),
        contentBytes: content.toString("base64"),
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

// ─── Token ────────────────────────────────────────────────────────────────────

/**
 * Obtains a Microsoft Graph access token using the client_credentials flow.
 * No user credentials are required — the app itself is the principal.
 */
async function accessToken(clientId, clientSecret) {
  const tokenData = new URLSearchParams();
  tokenData.append("client_id", clientId);
  tokenData.append("client_secret", clientSecret);
  tokenData.append("scope", "https://graph.microsoft.com/.default");
  tokenData.append("grant_type", "client_credentials");

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  try {
    const response = await axios.post(tokenUrl, tokenData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 10000,
    });
    return response.data.access_token;
  } catch (error) {
    const newError = new Error(
      "Failed to obtain mail access token: " + error.message,
    );
    newError.cause = error;
    throw newError;
  }
}

// ─── Send Email ───────────────────────────────────────────────────────────────

export async function sendEmail(
  to_emails,
  subject,
  mailBody,
  cc_emails = [],
  filePaths = [],
) {
  try {
    const token = await accessToken(clientId, clientSecret);
    // URL-encode the username to handle special characters (e.g., + in email addresses)
    const encodedUsername = encodeURIComponent(username);
    const mailUrl = `https://graph.microsoft.com/v1.0/users/${encodedUsername}/sendMail`;

    const toRecipients = to_emails.map((email) => ({
      emailAddress: { address: email },
    }));

    const ccRecipients = cc_emails.map((email) => ({
      emailAddress: { address: email },
    }));

    const attachments =
      filePaths.length > 0 ? await buildAttachments(filePaths) : [];

    const messagePayload = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: mailBody,
        },
        toRecipients,
        ccRecipients,
        attachments,
      },
      saveToSentItems: true,
    };

    const config = {
      method: "POST",
      url: mailUrl,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      data: JSON.stringify(messagePayload),
      timeout: 10000,
    };

    const response = await axios(config);
    return {
      flag: true,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      flag: false,
      error: {
        message: error.message,
        name: error.name,
      },
    };
  }
}

// ─── Mail Content Generators ──────────────────────────────────────────────────

export const forgotPasswordMailgenContent = (userName, passwordResetUrl) => {
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
      intro: "We got a request to reset the password of your account",
      action: {
        instructions:
          "To reset your password click on the following button or link:",
        button: {
          color: "#22BC66",
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
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
