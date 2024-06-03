const { query } = require("express-validator");

const redirectToTheUrlValidator = () => {
  return [
    query("url")
      .trim()
      .notEmpty()
      .withMessage("url is required")
      .isURL()
      .withMessage("URL passed in the query is invalid"),
  ];
};

module.exports = { redirectToTheUrlValidator };
