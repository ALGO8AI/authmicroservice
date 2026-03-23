import "dotenv/config";
import readline from "readline";
import sequelize from "../src/config/db.js";
import PlatformUsers from "../src/models/auth/PlatformUsers.model.js";
import { generateHashPassword } from "../src/utils/password.js";
import { UserRolesEnum } from "../src/constants.js";
import logger from "../src/logger/winston.logger.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

const questionHidden = (prompt) =>
  new Promise((resolve) => {
    process.stdout.write(prompt);

    // Hide input by switching to raw mode and manually handling characters.
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let input = "";

    const onData = (char) => {
      if (char === "\u0003") {
        // Ctrl+C
        process.stdout.write("\n");
        stdin.setRawMode(false);
        stdin.removeListener("data", onData);
        rl.close();
        process.exit(0);
      } else if (char === "\r" || char === "\n") {
        // Enter
        process.stdout.write("\n");
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        resolve(input);
      } else if (char === "\u007f" || char === "\b") {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        input += char;
        process.stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });

async function main() {
  try {
    await sequelize.authenticate();

    console.log("\n--- Create Initial Admin ---\n");

    // Prompt for email
    const email = (await question("Email: ")).trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error("Invalid email address.");
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await PlatformUsers.findOne({ where: { email } });
    if (existingUser) {
      console.error(
        `A user with email "${email}" already exists (role: ${existingUser.roleId}).`,
      );
      process.exit(1);
    }

    // Prompt for password (hidden input)
    const password = await questionHidden("Password: ");

    if (!password || password.length < 8) {
      console.error("Password must be at least 8 characters.");
      process.exit(1);
    }

    const confirmPassword = await questionHidden("Confirm Password: ");

    if (password !== confirmPassword) {
      console.error("Passwords do not match.");
      process.exit(1);
    }

    rl.close();

    // Create the admin user
    const hashedPassword = await generateHashPassword(password);

    await PlatformUsers.create({
      email,
      password: hashedPassword,
      roleId: UserRolesEnum.ADMIN,
    });

    logger.info(`Admin user "${email}" created successfully.`);
    console.log(`\nAdmin user "${email}" created successfully.\n`);

    process.exit(0);
  } catch (error) {
    logger.error("Failed to create admin user:\n" + error.stack);
    console.error("\nError:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    rl.close();
  }
}

main();
