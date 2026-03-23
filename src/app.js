import cors from "cors";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";
import morganMiddleware from "./logger/morgan.logger.js";
import { requestId } from "./middlewares/requestId.middleware.js";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "./utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const httpServer = createServer(app);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://validator.swagger.io"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);

app.use(cookieParser());

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN === "*"
        ? "*"
        : process.env.CORS_ORIGIN?.split(","),
    credentials: true,
  }),
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip;
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${options.max} requests per ${options.windowMs / 60000} minutes`,
    );
  },
});

app.use(globalLimiter);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable is required but not set.",
  );
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

const UPLOAD_PATH = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

app.use(requestId);
app.use(morganMiddleware);

// Central router
import { errorHandler } from "./middlewares/error.middlewares.js";
import apiRouter from "./routes/index.js";

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const swaggerDocument = YAML.load(path.resolve(__dirname, "../swagger.yaml"));

app.use("/api/v1", apiRouter);

// API Documentation — served from swagger.yaml
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(errorHandler);

export { httpServer };
