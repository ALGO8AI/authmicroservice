import { beforeEach, describe, expect, it, jest } from "@jest/globals";

process.env.MAILUSER = "sender@example.com";
process.env.MAILPASS = "mail-pass";
process.env.MAIL_FROM_NAME = "Auth Bot";
process.env.PRODUCT_DOCS_URL = "https://docs.example.com";

const mockSendMail = jest.fn();
const mockTransport = { sendMail: mockSendMail };
const mockStat = jest.fn();
const mockReadFile = jest.fn();
const mockGenerate = jest.fn();
const mockLoggerError = jest.fn();
const mailgenInstances = [];

class MockMailgen {
  constructor(config) {
    this.config = config;
    mailgenInstances.push(this);
  }

  generate(payload) {
    return mockGenerate(payload);
  }
}

await jest.unstable_mockModule("nodemailer", () => ({
  default: {
    createTransport: jest.fn(() => mockTransport),
  },
}));

await jest.unstable_mockModule("fs", () => ({
  default: {
    promises: {
      stat: mockStat,
      readFile: mockReadFile,
    },
  },
}));

await jest.unstable_mockModule("mailgen", () => ({
  default: MockMailgen,
}));

await jest.unstable_mockModule("../../../src/logger/winston.logger.js", () => ({
  default: {
    error: mockLoggerError,
  },
}));

const {
  sendEmail,
  forgotPasswordOtpMailgenContent,
  newUserRegisterMailgen,
} = await import("../../../src/utils/mail.js");

describe("mail utils", () => {
  beforeEach(() => {
    mailgenInstances.length = 0;
    mockGenerate.mockReset().mockReturnValue("<html>mail</html>");
  });

  it("sends an email with normalized recipients and attachments", async () => {
    mockStat.mockResolvedValue({ size: 1024 });
    mockReadFile.mockResolvedValue(Buffer.from("file"));
    mockSendMail.mockResolvedValue({ messageId: "msg-1" });

    const result = await sendEmail(
      "user@example.com",
      "Subject",
      "<b>Body</b>",
      "cc@example.com",
      ["C:/tmp/report.csv"],
    );

    expect(result).toEqual({ flag: true, messageId: "msg-1" });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"Auth Bot" <sender@example.com>',
        to: "user@example.com",
        cc: "cc@example.com",
        subject: "Subject",
        html: "<b>Body</b>",
        attachments: [
          {
            filename: "report.csv",
            content: Buffer.from("file"),
          },
        ],
      }),
    );
  });

  it("returns a structured failure when mail delivery throws", async () => {
    const error = Object.assign(new Error("smtp failed"), { code: "EAUTH" });
    mockSendMail.mockRejectedValue(error);

    const result = await sendEmail(["user@example.com"], "Subject", "Body");

    expect(result).toEqual({
      flag: false,
      error: {
        message: "smtp failed",
        name: "Error",
        code: "EAUTH",
      },
    });
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Email send failed",
      expect.objectContaining({
        to: ["user@example.com"],
        subject: "Subject",
        error: "smtp failed",
      }),
    );
  });

  it("rejects oversized attachments before calling nodemailer", async () => {
    mockStat.mockResolvedValue({ size: 4 * 1024 * 1024 });

    const result = await sendEmail(["user@example.com"], "Subject", "Body", [], ["C:/tmp/big.zip"]);

    expect(result.flag).toBe(false);
    expect(result.error.message).toContain("exceeds");
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("builds forgot-password mail content with product link", () => {
    const html = forgotPasswordOtpMailgenContent("Raunak", 123456);

    expect(html).toBe("<html>mail</html>");
    expect(mailgenInstances[0].config.product.link).toBe("https://docs.example.com");
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ name: "Raunak" }),
      }),
    );
  });

  it("falls back to localhost docs outside production when docs url is missing", () => {
    delete process.env.PRODUCT_DOCS_URL;

    newUserRegisterMailgen("User", "user@example.com", "https://setup.example.com");

    expect(mailgenInstances[0].config.product.link).toBe("http://localhost:8080/docs");
  });

  it("throws when docs url is missing in production", () => {
    delete process.env.PRODUCT_DOCS_URL;
    process.env.NODE_ENV = "production";

    expect(() =>
      forgotPasswordOtpMailgenContent("User", 123456),
    ).toThrow("PRODUCT_DOCS_URL environment variable is required in production");
  });
});
