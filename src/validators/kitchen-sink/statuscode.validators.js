const { param } = require("express-validator");

const statusCodeValidator = () => {
  return [
    param("statusCode")
      .notEmpty()
      .isInt({ min: 100 })
      .withMessage("Invalid status code"),
  ];
};

module.exports = { statusCodeValidator };
