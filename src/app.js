const cors = require("cors");
const express = require("express");
const {createServer} = require("http");
const morganMiddleware = require("./logger/morgan.logger")

const app = express();

const httpServer = createServer(app);

app.use(
    cors({
        origin: process.env.CORS_ORIGIN === "*" ? "*": process.env.CORS_ORIGIN?.split(","),
        credentials: true,
    })
);

// rate limiter middleware

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit : "16kb" }));

app.use(morganMiddleware);

// const errorHandler; import
// const ealthcheck route; import

module.exports = { httpServer }

