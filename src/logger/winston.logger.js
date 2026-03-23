import winston from "winston";

// Define your severity levels.
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// This method set the current severity based on
// the current NODE_ENV: show all the log levels
// if the server was run in development mode; otherwise,
// if it was run in production, show only warn and error messages.
const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

// Define different colors for each level.
// Colors make the log message more visible,
// adding the ability to focus or ignore messages.
const colors = {
  error: "red",
  warn: "yellow",
  info: "blue",
  http: "magenta",
  debug: "white",
};

// Tell winston that you want to link the colors
// defined above to the severity levels.
winston.addColors(colors);

// Chose the aspect of your log customizing the log format.
const format = winston.format.combine(
  winston.format.timestamp({ format: "DD MMM, YYYY - HH:mm:ss:SSS" }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    let output = `[${info.timestamp}] ${info.level}: ${info.message}`;
    if (Object.keys(info).length > 4) {
      const meta = Object.keys(info)
        .filter((key) => !["timestamp", "level", "message"].includes(key))
        .reduce((obj, key) => {
          obj[key] = info[key];
          return obj;
        }, {});
      output += ` ${JSON.stringify(meta)}`;
    }
    return output;
  }),
);

// Define which transports the logger must use to print out messages.
const transports = [
  // Allow the use the console to print the messages
  new winston.transports.Console(),
];

// Create the logger instance that has to be exported
// and used to log messages.
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger;
