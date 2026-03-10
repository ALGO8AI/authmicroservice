const Sequelize = require("sequelize");

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: 3306,
  dialect: "mysql",
  pool: {
    max: 10,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  dialectOptions: {
    connectTimeout: 30000, // Timeout in milliseconds for initial connection
  },
  logging: false,
});

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    // Connection is successful, log it
    console.log("⚙️  MySQL connection has been established successfully.");
  })
  .catch((err) => {
    // Connection failed, log error
    console.log("Unable to connect to the database:", err);
});

module.exports = sequelize;
