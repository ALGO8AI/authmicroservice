import morgan from "morgan";
import logger from "./winston.logger.js";

const stream = {
  // Use the http severity
  write: (message) => logger.http(message.trim()),
};

const morganMiddleware = morgan(
  ":remote-addr :method :url :status - :response-time ms",
  { stream },
);

export default morganMiddleware;
