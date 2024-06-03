const cors = require("cors");
const express = require("express");
const {createServer} = require("http");
const morganMiddleware = require("./logger/morgan.logger");
const { rateLimit } = require("express-rate-limit");
const { ApiError } = require("./utils/ApiError.js");
const { ApiResponse } = require("./utils/ApiResponse.js");

const app = express();

const httpServer = createServer(app);

app.use(
    cors({
        origin: process.env.CORS_ORIGIN === "*" ? "*": process.env.CORS_ORIGIN?.split(","),
        credentials: true,
    })
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
        return req.ip
    },
    handler: (_, __, ___, options) => {
        throw new ApiError(
            options.statusCode || 500,
            `There are too many requests. You are only allowed ${options.max} requests per ${options.windowMs / 60000} minutes`
        )
    },
});

app.use(limiter);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit : "16kb" }));

app.use(morganMiddleware);

// App routes
const { errorHandler } = require("./middlewares/error.middlewares.js");
const healthcheckRouter = require("./routes/healthcheck.routes.js");

// * Kitchen sink routes
const httpmethodRouter = require("./routes/kitchen-sink/httpmethod.routes.js");
const redirectRouter = require("./routes/kitchen-sink/redirect.routes.js");
const requestinspectionRouter = require("./routes/kitchen-sink/requestinspection.routes.js");
const responseinspectionRouter = require("./routes/kitchen-sink/responseinspection.routes.js");
const statuscodeRouter = require("./routes/kitchen-sink/statuscode.routes.js");

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("../swagger-output.json");

// const healthcheck route; import
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// * Kitchen sink apis
app.use("/api/v1/kitchen-sink/http-methods", httpmethodRouter);
app.use("/api/v1/kitchen-sink/status-codes", statuscodeRouter);
app.use("/api/v1/kitchen-sink/request", requestinspectionRouter);
app.use("/api/v1/kitchen-sink/response", responseinspectionRouter);
app.use("/api/v1/kitchen-sink/redirect", redirectRouter);


app.use(errorHandler);

module.exports = { httpServer }

